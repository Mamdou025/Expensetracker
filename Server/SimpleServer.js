// Simple ExpenseTracker Server - No complex features, just working
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const { setupSimpleAuth, requireAuth } = require('./simpleAuth');

const app = express();
const port = 5000;

// Basic middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json());

// Database connection
const dbPath = path.join(__dirname, '../Database/transactions.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to database:', dbPath);
    }
});

// Setup simple authentication
setupSimpleAuth(app);

// Get all transactions (protected route)
app.get('/api/transactions', requireAuth, (req, res) => {
    const query = `
        SELECT t.id, t.amount, t.description, t.card_type, t.date, t.time, t.bank, t.category,
               COALESCE(GROUP_CONCAT(g.tag_name, ', '), '') AS tags
        FROM transactions t
        LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
        LEFT JOIN tags g ON tt.tag_id = g.id
        GROUP BY t.id, t.amount, t.description, t.card_type, t.date, t.time, t.bank, t.category
        ORDER BY t.date DESC;
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('❌ Error fetching transactions:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Add a new transaction
app.post('/api/transactions', requireAuth, (req, res) => {
    const { amount, description, card_type, date, bank, category = 'Uncategorized' } = req.body;
    
    const query = `INSERT INTO transactions (amount, description, card_type, date, bank, category)
                   VALUES (?, ?, ?, ?, ?, ?)`;
                   
    db.run(query, [amount, description, card_type, date, bank, category], function(err) {
        if (err) {
            console.error('❌ Error adding transaction:', err);
            return res.status(500).json({ error: err.message });
        }
        
        res.json({
            id: this.lastID,
            amount,
            description,
            card_type,
            date,
            bank,
            category
        });
    });
});

// Update transaction category
app.put('/api/transactions/:id/category', requireAuth, (req, res) => {
    const { id } = req.params;
    const { category } = req.body;

    const query = 'UPDATE transactions SET category = ? WHERE id = ?';

    db.run(query, [category, id], function (err) {
        if (err) {
            console.error('❌ Error updating category:', err);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ message: `✅ Transaction ${id} updated to category '${category}'` });
    });
});

// Delete transaction
app.delete('/api/transactions/:id', requireAuth, (req, res) => {
    const { id } = req.params;

    // Remove tag links first
    db.run('DELETE FROM transaction_tags WHERE transaction_id = ?', [id], function (err) {
        if (err) {
            console.error('❌ Error removing tags:', err);
            return res.status(500).json({ error: err.message });
        }

        // Delete the transaction
        db.run('DELETE FROM transactions WHERE id = ?', [id], function (err2) {
            if (err2) {
                console.error('❌ Error deleting transaction:', err2);
                return res.status(500).json({ error: err2.message });
            }
            res.json({ message: `✅ Transaction ${id} deleted` });
        });
    });
});

// Get all categories
app.get('/api/categories', requireAuth, (req, res) => {
    const query = `
        SELECT 
            category as name,
            COUNT(*) as transaction_count,
            SUM(ABS(amount)) as total_amount
        FROM transactions 
        WHERE category IS NOT NULL
        GROUP BY category
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('❌ Error fetching categories:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get all tags
app.get('/api/tags', requireAuth, (req, res) => {
    const query = `
        SELECT g.tag_name AS tag, 
               GROUP_CONCAT(t.description, ', ') AS transactions
        FROM tags g
        JOIN transaction_tags tt ON g.id = tt.tag_id
        JOIN transactions t ON tt.transaction_id = t.id
        GROUP BY g.tag_name;
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('❌ Error fetching tags:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected'
    });
});

// 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
    console.log('🚀 Simple ExpenseTracker Server running!');
    console.log(`📡 Server: http://localhost:${port}`);
    console.log(`📊 Database: ${dbPath}`);
    console.log(`👤 Demo Login: demo@expensetracker.com / Demo123!`);
    console.log('🔐 Auth: /api/auth/health to test');
});

// Keep the server running
console.log('🎯 Server is ready for requests!');