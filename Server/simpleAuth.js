// Simple Authentication System - No complex features, just working login
const express = require('express');

// Simple hardcoded users (in production, use a database)
const DEMO_USERS = {
    'demo@expensetracker.com': {
        id: 1,
        email: 'demo@expensetracker.com',
        password: 'Demo123!', // In production, hash this
        firstName: 'Demo',
        lastName: 'User'
    }
};

// Store active sessions (in production, use Redis or database)
const activeSessions = new Map();

// Simple session token generator
function generateSessionToken() {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

// Simple auth middleware
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization required' });
    }
    
    const token = authHeader.substring(7);
    const session = activeSessions.get(token);
    
    if (!session) {
        return res.status(401).json({ error: 'Invalid session' });
    }
    
    // Check if session expired (24 hours)
    if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
        activeSessions.delete(token);
        return res.status(401).json({ error: 'Session expired' });
    }
    
    req.user = session.user;
    next();
}

function setupSimpleAuth(app) {
    // Login endpoint
    app.post('/api/auth/login', (req, res) => {
        const { email, password } = req.body;
        
        console.log('🔐 Login attempt:', email);
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        const user = DEMO_USERS[email];
        if (!user || user.password !== password) {
            console.log('❌ Invalid credentials for:', email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Create session
        const token = generateSessionToken();
        const session = {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            },
            createdAt: Date.now()
        };
        
        activeSessions.set(token, session);
        
        console.log('✅ Login successful for:', email);
        res.json({
            success: true,
            token: token,
            user: session.user
        });
    });
    
    // Get current user
    app.get('/api/auth/me', requireAuth, (req, res) => {
        res.json({ user: req.user });
    });
    
    // Logout endpoint
    app.post('/api/auth/logout', requireAuth, (req, res) => {
        const authHeader = req.headers.authorization;
        const token = authHeader.substring(7);
        activeSessions.delete(token);
        res.json({ success: true });
    });
    
    // Health check
    app.get('/api/auth/health', (req, res) => {
        res.json({ 
            status: 'ok', 
            activeSessions: activeSessions.size,
            demoUser: 'demo@expensetracker.com'
        });
    });
}

module.exports = { setupSimpleAuth, requireAuth };