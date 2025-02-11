const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json()); // ✅ Allow JSON request body parsing

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

// ✅ Endpoint to fetch transactions by category
app.get('/api/transactions/category/:category', (req, res) => {
    const category = req.params.category;
    const query = 'SELECT * FROM transactions WHERE category = ?';
    
    db.all(query, [category], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// ✅ Endpoint to update a transaction's category
app.put('/api/transactions/:id/category', (req, res) => {
    const { id } = req.params;
    const { category } = req.body;

    const query = 'UPDATE transactions SET category = ? WHERE id = ?';
    
    db.run(query, [category, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: "Transaction not found" });
            return;
        }
        res.json({ message: `✅ Transaction ID ${id} updated to category '${category}'` });
    });
});

// ✅ Start the server
app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
});
