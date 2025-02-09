const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 5000;

app.use(cors()); // Allow cross-origin requests

// ✅ Construct absolute path to transactions.db in Database folder
const dbPath = path.join(__dirname, '../Database/transactions.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Failed to connect to database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database at:', dbPath);
    }
});

// ✅ Endpoint to fetch all transactions
app.get('/api/transactions', (req, res) => {
    const query = 'SELECT * FROM transactions';
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// ✅ Endpoint to fetch a single transaction by ID
app.get('/api/transactions/:id', (req, res) => {
    const query = 'SELECT * FROM transactions WHERE id = ?';
    db.get(query, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(row);
    });
});

// ✅ Start the server
app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
});
