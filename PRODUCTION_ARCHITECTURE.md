# Production Architecture & Scaling Strategy

## Current vs Production Architecture 🏗️

### Current Architecture (Single User)
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   React     │    │   Node.js   │    │   SQLite    │
│  Frontend   │───▶│   Server    │───▶│  Database   │
│   (Port     │    │  (Port      │    │   (File)    │
│   3000)     │    │   5000)     │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │   Python    │
                   │Email Scripts│
                   │  (Manual)   │
                   └─────────────┘
```

### Production Architecture (Multi-User + Scalable)
```
                    ┌─────────────┐
                    │  Load       │
                    │  Balancer   │
                    │  (Nginx)    │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
   │ App     │        │ App     │        │ App     │
   │Instance │        │Instance │        │Instance │
   │   #1    │        │   #2    │        │   #3    │
   └────┬────┘        └────┬────┘        └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │                                     │
   ┌────▼────┐  ┌──────────┐  ┌──────────┐    │
   │Primary  │  │Background│  │  Cache   │    │
   │Database │  │  Queue   │  │ (Redis)  │    │
   │(Postgres│  │(Bull/Bee)│  │          │    │
   │ or      │  │          │  │          │    │
   │MySQL)   │  │          │  │          │    │
   └─────────┘  └──────────┘  └──────────┘    │
                                             │
   ┌─────────────────────────────────────────▼┐
   │           Monitoring Stack               │
   │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
   │  │ Logging │ │Metrics  │ │ Alerts  │   │
   │  │(Winston)│ │(Prom.)  │ │(Sentry) │   │
   │  └─────────┘ └─────────┘ └─────────┘   │
   └─────────────────────────────────────────┘
```

## Database Migration Strategy 📊

### Step 1: Single to Multi-Tenant Database
```sql
-- Create new production schema
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires DATETIME
);

-- Add user_id to all existing tables
ALTER TABLE transactions ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE categories ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE tags ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE keyword_rules ADD COLUMN user_id INTEGER REFERENCES users(id);

-- Create indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_keyword_rules_user_id ON keyword_rules(user_id);
CREATE INDEX idx_users_email ON users(email);

-- Add row-level security (PostgreSQL)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_transactions ON transactions 
    FOR ALL TO app_user 
    USING (user_id = current_setting('app.current_user_id')::INTEGER);
```

### Step 2: Email Processing Queue System
```javascript
// Server/queue/emailProcessor.js
const Queue = require('bull');
const emailQueue = new Queue('email processing');

emailQueue.process('extract-transactions', async (job) => {
    const { userId, emailContent, bankType } = job.data;
    
    try {
        // Process email using Python scripts
        const result = await processEmailForUser(userId, emailContent, bankType);
        
        // Store transactions in user's account
        await storeTransactions(userId, result.transactions);
        
        return { success: true, transactions: result.transactions.length };
    } catch (error) {
        throw new Error(`Email processing failed: ${error.message}`);
    }
});

// Add job to queue
app.post('/api/process-email', authenticateUser, async (req, res) => {
    const job = await emailQueue.add('extract-transactions', {
        userId: req.user.id,
        emailContent: req.body.email,
        bankType: req.body.bankType
    });
    
    res.json({ jobId: job.id, status: 'queued' });
});
```

## Performance Optimization 🚀

### 1. Database Optimization
```javascript
// Connection pooling
const { Pool } = require('pg');
const pool = new Pool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20, // Maximum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Query optimization with prepared statements
const getTransactionsByUser = pool.prepare(`
    SELECT t.*, c.name as category_name 
    FROM transactions t 
    LEFT JOIN categories c ON t.category_id = c.id 
    WHERE t.user_id = $1 
    ORDER BY t.date DESC 
    LIMIT $2 OFFSET $3
`);

// Caching layer
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

async function getCachedTransactions(userId, page = 1) {
    const cacheKey = `transactions:${userId}:${page}`;
    const cached = await client.get(cacheKey);
    
    if (cached) {
        return JSON.parse(cached);
    }
    
    const transactions = await getTransactionsByUser(userId, 50, (page - 1) * 50);
    await client.setex(cacheKey, 300, JSON.stringify(transactions)); // 5min cache
    
    return transactions;
}
```

### 2. API Rate Limiting & Security
```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
});

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Only 5 login attempts per 15 minutes
    skipSuccessfulRequests: true,
});

app.use('/api/', limiter);
app.use('/api/auth/login', strictLimiter);

// Input validation middleware
const { body, validationResult } = require('express-validator');

const validateTransaction = [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('description').trim().isLength({ min: 1, max: 500 }),
    body('date').isISO8601().withMessage('Invalid date format'),
    body('category_id').optional().isInt(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
```

## Monitoring & Observability 📊

### Application Monitoring
```javascript
// Server/middleware/monitoring.js
const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
});

const activeUsers = new prometheus.Gauge({
    name: 'active_users_total',
    help: 'Number of active users'
});

const transactionsProcessed = new prometheus.Counter({
    name: 'transactions_processed_total',
    help: 'Total number of transactions processed'
});

// Middleware to track metrics
function metricsMiddleware(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        httpRequestDuration
            .labels(req.method, req.route?.path || req.path, res.statusCode)
            .observe(duration);
    });
    
    next();
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: 'connected' // Add actual DB health check
    });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
    res.set('Content-Type', prometheus.register.contentType);
    res.end(prometheus.register.metrics());
});
```

### Error Tracking & Logging
```javascript
// Error tracking with Sentry
const Sentry = require('@sentry/node');

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
});

// Structured logging
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'expensetracker' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Global error handler
app.use(Sentry.Handlers.errorHandler());
app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        userId: req.user?.id
    });
    
    res.status(500).json({ 
        error: 'Internal server error',
        requestId: req.id
    });
});
```

## Scaling Timeline 📈

### Phase 1: MVP (0-100 users)
- ✅ Single server deployment (Railway/Render)
- ✅ SQLite database
- ✅ Basic authentication
- ✅ Manual email processing

### Phase 2: Growth (100-1000 users)
- 🔄 Migrate to PostgreSQL
- 🔄 Add Redis caching
- 🔄 Implement email queue
- 🔄 Add monitoring

### Phase 3: Scale (1000+ users)
- ⏳ Multiple server instances
- ⏳ Load balancer
- ⏳ Database read replicas
- ⏳ CDN for static assets

### Infrastructure Costs by Phase

| Phase | Users | Monthly Cost | Components |
|-------|-------|-------------|------------|
| **MVP** | 0-100 | $5-15 | Single server, SQLite |
| **Growth** | 100-1K | $50-100 | Server + DB + Redis + Monitoring |
| **Scale** | 1K+ | $200-500 | Multi-server + Load balancer + CDN |

## Migration Checklist ✅

### Pre-Migration
- [ ] Backup existing data
- [ ] Set up staging environment
- [ ] Create user accounts for existing data
- [ ] Test authentication system
- [ ] Validate email processing queue

### Migration Day
- [ ] Run database migration script
- [ ] Deploy new application version
- [ ] Update DNS records
- [ ] Monitor error rates
- [ ] Send user communication

### Post-Migration
- [ ] Monitor performance metrics
- [ ] Gather user feedback
- [ ] Scale resources as needed
- [ ] Document lessons learned

**Ready for Production?** 
Your app is now architected for thousands of users with proper security, monitoring, and scalability! 🚀