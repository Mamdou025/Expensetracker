// Authentication middleware and routes
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour per IP
    message: 'Too many registration attempts, please try again later.',
});

// Validation rules
const registerValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('firstName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name is required and must be less than 50 characters'),
    body('lastName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name is required and must be less than 50 characters'),
];

const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
];

// JWT Helper functions
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
            }
            return res.status(403).json({ error: 'Invalid token' });
        }
        
        if (user.type !== 'access') {
            return res.status(403).json({ error: 'Invalid token type' });
        }
        
        req.user = { id: user.userId };
        next();
    });
};

// Auth routes
const setupAuthRoutes = (app, db) => {
    
    // Register endpoint
    app.post('/api/auth/register', registerLimiter, registerValidation, async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            
            const { email, password, firstName, lastName } = req.body;
            
            // Check if user already exists
            const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
            if (existingUser) {
                return res.status(409).json({ error: 'User with this email already exists' });
            }
            
            // Hash password
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            
            // Generate verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');
            
            // Insert user
            const stmt = db.prepare(`
                INSERT INTO users (email, password_hash, first_name, last_name, verification_token, created_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);
            
            const result = stmt.run(email, passwordHash, firstName, lastName, verificationToken);
            
            // Create default categories for new user
            const defaultCategories = [
                'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 
                'Bills & Utilities', 'Healthcare', 'Travel', 'Education', 'Other'
            ];
            
            const categoryStmt = db.prepare('INSERT INTO categories (name, user_id) VALUES (?, ?)');
            defaultCategories.forEach(category => {
                categoryStmt.run(category, result.lastInsertRowid);
            });
            
            res.status(201).json({
                message: 'User registered successfully',
                userId: result.lastInsertRowid,
                requiresEmailVerification: true
            });
            
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Internal server error during registration' });
        }
    });
    
    // Login endpoint
    app.post('/api/auth/login', authLimiter, loginValidation, async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            
            const { email, password } = req.body;
            
            // Get user from database
            const user = db.prepare(`
                SELECT id, email, password_hash, first_name, last_name, is_active, email_verified
                FROM users WHERE email = ?
            `).get(email);
            
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
            
            if (user.is_active !== 1) {
                return res.status(401).json({ error: 'Account is deactivated' });
            }
            
            // Verify password
            const passwordValid = await bcrypt.compare(password, user.password_hash);
            if (!passwordValid) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
            
            // Generate tokens
            const { accessToken, refreshToken } = generateTokens(user.id);
            
            // Update last login
            db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
            
            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    emailVerified: user.email_verified
                },
                accessToken,
                refreshToken
            });
            
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error during login' });
        }
    });
    
    // Refresh token endpoint
    app.post('/api/auth/refresh', (req, res) => {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }
        
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ error: 'Invalid refresh token' });
            }
            
            if (user.type !== 'refresh') {
                return res.status(403).json({ error: 'Invalid token type' });
            }
            
            const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.userId);
            
            res.json({
                accessToken,
                refreshToken: newRefreshToken
            });
        });
    });
    
    // Logout endpoint (client-side token removal)
    app.post('/api/auth/logout', authenticateToken, (req, res) => {
        // In a production app, you might want to blacklist the token
        res.json({ message: 'Logged out successfully' });
    });
    
    // Get current user profile
    app.get('/api/auth/profile', authenticateToken, (req, res) => {
        try {
            const user = db.prepare(`
                SELECT id, email, first_name, last_name, created_at, last_login, email_verified
                FROM users WHERE id = ?
            `).get(req.user.id);
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                createdAt: user.created_at,
                lastLogin: user.last_login,
                emailVerified: user.email_verified
            });
            
        } catch (error) {
            console.error('Profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    
    // Change password
    app.put('/api/auth/change-password', authenticateToken, [
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('New password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    ], async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            
            const { currentPassword, newPassword } = req.body;
            
            // Get current password hash
            const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Verify current password
            const passwordValid = await bcrypt.compare(currentPassword, user.password_hash);
            if (!passwordValid) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }
            
            // Hash new password
            const saltRounds = 12;
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
            
            // Update password
            db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run(newPasswordHash, req.user.id);
            
            res.json({ message: 'Password changed successfully' });
            
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
};

module.exports = {
    setupAuthRoutes,
    authenticateToken,
    authLimiter
};