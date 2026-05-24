const session = require('express-session');
const passport = require('passport');
const memoize = require('memoizee');
const connectPg = require('connect-pg-simple');
const { Pool } = require('pg');

let openidClient = null;
let OpenidStrategy = null;

const OWNER_EMAIL = 'fallmamadou151@gmail.com';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ensureAuthTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire)`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR PRIMARY KEY,
      email VARCHAR UNIQUE,
      first_name VARCHAR,
      last_name VARCHAR,
      profile_image_url VARCHAR,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function getUser(id) {
  const r = await pool.query('SELECT id, email, first_name, last_name, profile_image_url FROM users WHERE id = $1', [id]);
  return r.rows[0] || null;
}

async function upsertUser(u) {
  await pool.query(
    `INSERT INTO users (id, email, first_name, last_name, profile_image_url, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       first_name = EXCLUDED.first_name,
       last_name = EXCLUDED.last_name,
       profile_image_url = EXCLUDED.profile_image_url,
       updated_at = NOW()`,
    [u.id, u.email || null, u.firstName || null, u.lastName || null, u.profileImageUrl || null]
  );
}

function claimOwnerRowsIfNeeded(sqliteDb, userId, email) {
  if (!email || email.toLowerCase() !== OWNER_EMAIL) return;
  sqliteDb.serialize(() => {
    sqliteDb.run(`UPDATE transactions SET user_id = ? WHERE user_id IS NULL`, [userId], (err) => {
      if (err) console.error('Owner claim (transactions) failed:', err.message);
    });
    sqliteDb.run(`UPDATE keyword_rules SET user_id = ? WHERE user_id IS NULL`, [userId], (err) => {
      if (err) console.error('Owner claim (keyword_rules) failed:', err.message);
    });
    sqliteDb.run(`UPDATE chat_usage SET user_id = ? WHERE user_id IS NULL`, [userId], (err) => {
      if (err) console.error('Owner claim (chat_usage) failed:', err.message);
    });
  });
}

let _getOidcConfig = null;
function getOidcConfig() {
  if (!_getOidcConfig) {
    _getOidcConfig = memoize(
      async () => {
        return await openidClient.discovery(
          new URL(process.env.ISSUER_URL || 'https://replit.com/oidc'),
          process.env.REPL_ID
        );
      },
      { maxAge: 3600 * 1000 }
    );
  }
  return _getOidcConfig();
}

function buildSessionMiddleware() {
  const ttl = 7 * 24 * 60 * 60 * 1000;
  const PgStore = connectPg(session);
  const store = new PgStore({
    pool,
    createTableIfMissing: false,
    ttl,
    tableName: 'sessions',
  });
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set in production');
    }
    console.warn('⚠️  SESSION_SECRET is not set — using a random ephemeral dev secret. Sessions will not survive restarts.');
  }
  const effectiveSecret = secret || require('crypto').randomBytes(32).toString('hex');
  return session({
    secret: effectiveSecret,
    store,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: true, maxAge: ttl, sameSite: 'lax' },
  });
}

function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function setupAuth(app, sqliteDb) {
  openidClient = await import('openid-client');
  const passportMod = await import('openid-client/passport');
  OpenidStrategy = passportMod.Strategy;

  await ensureAuthTables();

  app.set('trust proxy', 1);
  app.use(buildSessionMiddleware());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify = async (tokens, verified) => {
    try {
      const user = {};
      updateUserSession(user, tokens);
      const claims = tokens.claims();
      await upsertUser({
        id: claims.sub,
        email: claims.email,
        firstName: claims.first_name,
        lastName: claims.last_name,
        profileImageUrl: claims.profile_image_url,
      });
      claimOwnerRowsIfNeeded(sqliteDb, claims.sub, claims.email);
      verified(null, user);
    } catch (e) {
      verified(e);
    }
  };

  const registered = new Set();
  const ensureStrategy = (domain) => {
    const name = `replitauth:${domain}`;
    if (registered.has(name)) return;
    const strategy = new OpenidStrategy(
      {
        name,
        config,
        scope: 'openid email profile offline_access',
        callbackURL: `https://${domain}/api/callback`,
      },
      verify
    );
    passport.use(strategy);
    registered.add(name);
  };

  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));

  app.get('/api/login', (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: 'login consent',
      scope: ['openid', 'email', 'profile', 'offline_access'],
    })(req, res, next);
  });

  app.get('/api/callback', (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: '/',
      failureRedirect: '/api/login',
    })(req, res, next);
  });

  app.get('/api/logout', (req, res) => {
    req.logout(() => {
      try {
        res.redirect(
          openidClient.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      } catch (e) {
        res.redirect('/');
      }
    });
  });

  app.get('/api/auth/user', async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user?.claims) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
      const user = await getUser(req.user.claims.sub);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profileImageUrl: user.profile_image_url,
        isOwner: (user.email || '').toLowerCase() === OWNER_EMAIL,
      });
    } catch (e) {
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });
}

const requireAuth = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated || !req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    req.userId = user.claims.sub;
    req.userEmail = user.claims.email;
    req.isOwner = (user.claims.email || '').toLowerCase() === OWNER_EMAIL;
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const config = await getOidcConfig();
    const tokenResponse = await openidClient.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    req.userId = user.claims.sub;
    req.userEmail = user.claims.email;
    req.isOwner = (user.claims.email || '').toLowerCase() === OWNER_EMAIL;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

const requireOwner = (req, res, next) => {
  if (!req.isOwner) return res.status(403).json({ error: 'Owner only' });
  next();
};

module.exports = { setupAuth, requireAuth, requireOwner, OWNER_EMAIL };
