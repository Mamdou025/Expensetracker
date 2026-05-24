const crypto = require('crypto');
const session = require('express-session');
const connectPg = require('connect-pg-simple');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const OWNER_EMAIL = 'fallmamadou151@gmail.com';

// Precomputed dummy hash used to keep login timing constant whether or not the
// account exists, preventing user-enumeration via response-time analysis.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-placeholder', 12);

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
      email VARCHAR UNIQUE NOT NULL,
      password_hash VARCHAR,
      first_name VARCHAR,
      last_name VARCHAR,
      profile_image_url VARCHAR,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  // In case the users table existed from the previous OIDC iteration, add the
  // password_hash column.
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR`);
}

async function getUserById(id) {
  const r = await pool.query(
    'SELECT id, email, first_name, last_name, profile_image_url FROM users WHERE id = $1',
    [id]
  );
  return r.rows[0] || null;
}

async function getUserByEmail(email) {
  const r = await pool.query(
    'SELECT id, email, password_hash, first_name, last_name, profile_image_url FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );
  return r.rows[0] || null;
}

async function createUser({ email, password, firstName, lastName }) {
  const id = crypto.randomUUID();
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users (id, email, password_hash, first_name, last_name)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, email, hash, firstName || null, lastName || null]
  );
  return { id, email, first_name: firstName || null, last_name: lastName || null };
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
  const effectiveSecret = secret || crypto.randomBytes(32).toString('hex');
  return session({
    name: 'expense.sid',
    secret: effectiveSecret,
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: ttl,
      sameSite: 'lax',
    },
    proxy: true,
  });
}

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name || null,
    lastName: user.last_name || null,
    profileImageUrl: user.profile_image_url || null,
    isOwner: (user.email || '').toLowerCase() === OWNER_EMAIL,
  };
}

function validEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function setupAuth(app, sqliteDb) {
  await ensureAuthTables();
  app.set('trust proxy', 1);
  app.use(buildSessionMiddleware());

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body || {};
      if (!validEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
      if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      const existing = await getUserByEmail(email);
      if (existing) return res.status(409).json({ error: 'An account with that email already exists' });

      const user = await createUser({ email: email.trim(), password, firstName, lastName });
      claimOwnerRowsIfNeeded(sqliteDb, user.id, user.email);
      req.session.userId = user.id;
      const fresh = await getUserById(user.id);
      res.json(serializeUser(fresh));
    } catch (e) {
      console.error('Register error:', e);
      res.status(500).json({ error: 'Failed to create account' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!validEmail(email) || typeof password !== 'string' || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      const user = await getUserByEmail(email);
      // Always run bcrypt.compare against either the real hash or a dummy hash
      // so the response time does not reveal whether the account exists.
      const hashToCheck = user?.password_hash || DUMMY_HASH;
      const passwordOk = await bcrypt.compare(password, hashToCheck);
      if (!user || !user.password_hash || !passwordOk) {
        return res.status(401).json({ error: 'Incorrect email or password' });
      }

      claimOwnerRowsIfNeeded(sqliteDb, user.id, user.email);
      req.session.userId = user.id;
      res.json(serializeUser(user));
    } catch (e) {
      console.error('Login error:', e);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.clearCookie('expense.sid');
      res.json({ ok: true });
    });
  });

  app.get('/api/auth/user', async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: 'Unauthorized' });
    try {
      const user = await getUserById(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: 'Unauthorized' });
      }
      res.json(serializeUser(user));
    } catch (e) {
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });
}

const requireAuth = (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'Unauthorized' });
  req.userId = req.session.userId;
  // We populate email/owner from the session lazily — but the rest of the app
  // only really needs it for the owner check, which is cheap to fetch.
  if (req.session.userEmail) {
    req.userEmail = req.session.userEmail;
    req.isOwner = (req.userEmail || '').toLowerCase() === OWNER_EMAIL;
    return next();
  }
  getUserById(req.userId)
    .then((u) => {
      if (!u) return res.status(401).json({ error: 'Unauthorized' });
      req.userEmail = u.email;
      req.isOwner = (u.email || '').toLowerCase() === OWNER_EMAIL;
      req.session.userEmail = u.email;
      next();
    })
    .catch(() => res.status(500).json({ error: 'Auth lookup failed' }));
};

const requireOwner = (req, res, next) => {
  if (!req.isOwner) return res.status(403).json({ error: 'Owner only' });
  next();
};

module.exports = { setupAuth, requireAuth, requireOwner, OWNER_EMAIL };
