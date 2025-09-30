# Production Security & Authentication Setup

## 1. User Authentication System

### Backend Authentication (JWT-based)
```javascript
// Add to Server.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
const SALT_ROUNDS = 10;

// Middleware to verify JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// User registration endpoint
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  try {
    // Check if user exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Create user
    const userId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, name, new Date().toISOString()],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Generate JWT token
    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      user: { id: userId, email, name },
      message: 'User created successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// User login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Protect all transaction endpoints
app.use('/api/transactions', authenticateToken);
app.use('/api/categories', authenticateToken);
app.use('/api/tags', authenticateToken);
```

### Database Schema Updates
```sql
-- Add users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    email_credentials TEXT, -- Encrypted email credentials
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Add user_id to transactions table
ALTER TABLE transactions ADD COLUMN user_id INTEGER REFERENCES users(id);

-- Create index for user transactions
CREATE INDEX IF NOT EXISTS idx_user_transactions ON transactions(user_id, date);
```

## 2. Environment Variables & Security
```bash
# .env file
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
DATABASE_URL=./Database/transactions.db
CORS_ORIGIN=https://your-domain.com
EMAIL_ENCRYPTION_KEY=your-encryption-key-for-email-creds

# Email service configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-app-email@gmail.com
SMTP_PASS=your-app-password
```

## 3. Input Validation & Sanitization
```javascript
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateTransaction = [
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('description').trim().isLength({ min: 1, max: 255 }).withMessage('Description required'),
  body('category').optional().trim().isLength({ max: 100 }),
  body('date').isISO8601().withMessage('Valid date required'),
];

// Apply validation to endpoints
app.post('/api/transactions', validateTransaction, authenticateToken, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ... rest of transaction creation logic
});
```

## 4. Rate Limiting & Security Headers
```javascript
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit each IP to 5 requests per windowMs
});

app.use('/api/auth/', authLimiter);
```

## Required Dependencies
```bash
npm install jsonwebtoken bcrypt express-validator express-rate-limit helmet
```