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

// ✅ Fetch all transactions with their tags
app.get('/api/transactions', (req, res) => {
    const query = `
        SELECT t.id, t.amount, t.description, t.card_type, t.date, t.time, t.bank, t.category,
               COALESCE(GROUP_CONCAT(g.tag_name, ', '), '') AS tags
        FROM transactions t
        LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
        LEFT JOIN tags g ON tt.tag_id = g.id
        GROUP BY t.id
        ORDER BY t.date DESC;
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// ✅ Fetch transactions by category
app.get('/api/transactions/category/:category', (req, res) => {
    const category = req.params.category;
    const query = `
        SELECT t.id, t.amount, t.description, t.card_type, t.date, t.time, t.bank, t.category,
               COALESCE(GROUP_CONCAT(g.tag_name, ', '), '') AS tags
        FROM transactions t
        LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
        LEFT JOIN tags g ON tt.tag_id = g.id
        WHERE t.category = ?
        GROUP BY t.id;
    `;

    db.all(query, [category], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// ✅ Fetch transactions by a specific tag
app.get('/api/transactions/tag/:tag', (req, res) => {
    const tagName = req.params.tag;
    const query = `
        SELECT t.id, t.amount, t.description, t.card_type, t.date, t.time, t.bank, t.category,
               COALESCE(GROUP_CONCAT(g.tag_name, ', '), '') AS tags
        FROM transactions t
        JOIN transaction_tags tt ON t.id = tt.transaction_id
        JOIN tags g ON tt.tag_id = g.id
        WHERE g.tag_name = ?
        GROUP BY t.id;
    `;

    db.all(query, [tagName], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// ✅ Fetch all tags and their associated transactions
app.get('/api/tags', (req, res) => {
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
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// ✅ Fetch tags for a specific transaction
app.get('/api/transactions/:id/tags', (req, res) => {
    const { id } = req.params;
    const query = `SELECT tag_name FROM tags 
                   JOIN transaction_tags ON tags.id = transaction_tags.tag_id
                   WHERE transaction_tags.transaction_id = ?`;

    db.all(query, [id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows.map(row => row.tag_name));
    });
});

// ✅ Add a tag to a transaction
app.post('/api/transactions/:id/tags', async (req, res) => {
    try {
        const { id } = req.params;
        const { tag } = req.body;

        if (!tag) {
            return res.status(400).json({ error: "Tag is required" });
        }

        // Check if tag exists
        const checkTagQuery = "SELECT id FROM tags WHERE tag_name = ?";
        const tagExists = await new Promise((resolve, reject) => {
            db.get(checkTagQuery, [tag], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        let tagId;
        if (!tagExists) {
            // Insert new tag if it doesn't exist
            const insertTagQuery = "INSERT INTO tags (tag_name) VALUES (?)";
            tagId = await new Promise((resolve, reject) => {
                db.run(insertTagQuery, [tag], function (err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                });
            });
        } else {
            tagId = tagExists.id;
        }

        // Link tag to transaction
        const insertTagLinkQuery = "INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)";
        await new Promise((resolve, reject) => {
            db.run(insertTagLinkQuery, [id, tagId], function (err) {
                if (err) reject(err);
                resolve();
            });
        });

        res.json({ message: "Tag added successfully" });
    } catch (error) {
        console.error("Error adding tag:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Remove a tag from a transaction
app.delete('/api/transactions/:id/tags', async (req, res) => {
    try {
        const { id } = req.params;
        const { tag } = req.body;

        if (!tag) {
            return res.status(400).json({ error: "Tag is required" });
        }

        const deleteTagQuery = `
            DELETE FROM transaction_tags 
            WHERE transaction_id = ? AND tag_id = (SELECT id FROM tags WHERE tag_name = ?)
        `;

        await new Promise((resolve, reject) => {
            db.run(deleteTagQuery, [id, tag], function (err) {
                if (err) reject(err);
                resolve();
            });
        });

        res.json({ message: "Tag removed successfully" });
    } catch (error) {
        console.error("Error removing tag:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});



// ✅ Update a transaction's category
app.put('/api/transactions/:id/category', (req, res) => {
    const { id } = req.params;
    const { category } = req.body;

    const query = 'UPDATE transactions SET category = ? WHERE id = ?';

    db.run(query, [category, id], function (err) {
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
