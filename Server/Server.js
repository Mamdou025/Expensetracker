const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

// Use "python" on Windows to support common installations
const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

const app = express();
// Allow overriding the port via environment variable
const port = process.env.PORT || 5000;

app.use(cors());
// Increase JSON payload limit to handle larger request bodies
app.use(express.json({ limit: '10mb' })); // ✅ Allow JSON request body parsing

// ✅ Construct absolute path to transactions.db in Database folder
const dbPath = path.join(__dirname, '../Database/transactions.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Échec de la connexion à la base de données:', err.message);
    } else {
        console.log('✅ Connecté à la base de données SQLite à:', dbPath);
    }
});

// ✅ FIXED: Fetch all transactions with their tags
app.get('/api/transactions', (req, res) => {
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

// ✅ Delete a tag from the tags table
app.delete('/api/tags/:tagName', (req, res) => {
    const { tagName } = req.params;

    const deleteTagQuery = `
        DELETE FROM tags WHERE tag_name = ?;
    `;

    db.run(deleteTagQuery, [tagName], function (err) {
        if (err) {
            console.error("❌ Failed to delete tag:", err);
            res.status(500).json({ error: "Failed to delete tag" });
            return;
        }

        res.json({ message: `✅ Tag '${tagName}' deleted successfully` });
    });
});


// Make sure this endpoint exists in your server.js:
app.put('/api/transactions/:id/category', (req, res) => {
    const { id } = req.params;
    const { category } = req.body;

    console.log('🔄 Updating transaction category:', { id, category }); // Add debug log

    const query = 'UPDATE transactions SET category = ? WHERE id = ?';

    db.run(query, [category, id], function (err) {
        if (err) {
            console.error('❌ Database error:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            console.log('❌ Transaction not found:', id);
            res.status(404).json({ error: "Transaction not found" });
            return;
        }
        console.log('✅ Category updated successfully');
        res.json({ message: `✅ Transaction ID ${id} updated to category '${category}'` });
    });
});

// Add these new endpoints to your server.js:

// Dashboard summary stats
app.get('/api/dashboard/stats', (req, res) => {
    const queries = {
        totalTransactions: "SELECT COUNT(*) as count FROM transactions",
        totalAmount: "SELECT SUM(amount) as total FROM transactions", 
        totalIncome: "SELECT SUM(amount) as total FROM transactions WHERE amount > 0",
        totalExpense: "SELECT SUM(ABS(amount)) as total FROM transactions WHERE amount < 0",
        avgTransaction: "SELECT AVG(amount) as avg FROM transactions"
    };
    
    // Execute all queries and combine results
    // Implementation similar to your existing patterns
});

// Monthly spending data for charts
app.get('/api/dashboard/monthly-spending', (req, res) => {
    const query = `
        SELECT 
            strftime('%Y-%m', date) as month,
            SUM(amount) as total_amount,
            COUNT(*) as transaction_count
        FROM transactions 
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month DESC 
        LIMIT 12
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add to server.js:
app.get('/api/analytics/category-breakdown', (req, res) => {
    const { startDate, endDate } = req.query;
    
    let query = `
        SELECT 
            category,
            COUNT(*) as transaction_count,
            SUM(ABS(amount)) as total_amount,
            AVG(ABS(amount)) as avg_amount
        FROM transactions 
    `;
    
    const params = [];
    if (startDate && endDate) {
        query += " WHERE date BETWEEN ? AND ?";
        params.push(startDate, endDate);
    }
    
    query += " GROUP BY category ORDER BY total_amount DESC";
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});
// Get all categories with stats
app.get('/api/categories', (req, res) => {
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
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get all tags with stats  
app.get('/api/tags/stats', (req, res) => {
    const query = `
        SELECT 
            g.tag_name as name,
            COUNT(tt.transaction_id) as usage_count,
            SUM(ABS(t.amount)) as total_amount
        FROM tags g
        LEFT JOIN transaction_tags tt ON g.id = tt.tag_id
        LEFT JOIN transactions t ON tt.transaction_id = t.id
        GROUP BY g.tag_name
        ORDER BY usage_count DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// ✅ Rule management endpoints for keyword-based categorization/tagging
app.get('/api/keyword-rules', (req, res) => {
    const query = 'SELECT keyword, category, tags FROM keyword_rules';
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.put('/api/keyword-rules/:keyword', (req, res) => {
    const { keyword } = req.params;
    const { category, tags } = req.body;
    const tagsString = Array.isArray(tags) ? tags.join(',') : tags;
    const query = `UPDATE keyword_rules SET category = COALESCE(?, category), tags = COALESCE(?, tags) WHERE keyword = ?`;

    db.run(query, [category, tagsString, keyword], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: `✅ Rule for '${keyword}' updated`, updated: this.changes });
    });
});

app.delete('/api/keyword-rules/:keyword', (req, res) => {
    const { keyword } = req.params;
    db.run('DELETE FROM keyword_rules WHERE keyword = ?', [keyword], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: `✅ Rule for '${keyword}' deleted` });
    });
});

// Extract emails within a date range and return preliminary transaction data
app.post('/api/extract-emails', (req, res) => {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate required' });
    }

    // Convert YYYY-MM-DD to DD-Mon-YYYY for the Python script
    function formatDate(iso) {
        const [y, m, d] = iso.split('-');
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${d}-${months[parseInt(m, 10) - 1]}-${y}`;
    }

    const formattedStart = formatDate(startDate);
    const formattedEnd = formatDate(endDate);

    const script = path.join(__dirname, '../Application/api_scripts/extract_emails.py');
    const py = spawn(pythonCmd, [script, formattedStart, formattedEnd]);

    py.on('error', (err) => {
        console.error('❌ Failed to start extract-emails script:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    });

    let output = '';
    let errOutput = '';
    py.stdout.on('data', (data) => { output += data; });
    py.stderr.on('data', (data) => { errOutput += data; });
    py.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: errOutput || 'Python script error' });
        }
        try {
            const parsed = JSON.parse(output);

            // Filter out emails where the extracted amount is missing
            const filtered = parsed.filter(item => {
                const amt = parseFloat(item?.transaction?.amount);
                return !isNaN(amt);
            });

            res.json(filtered);
        } catch (e) {
            res.status(500).json({ error: 'Failed to parse python output', details: output });
        }
    });
});

// Process a batch of emails into transactions
app.post('/api/process-queue', (req, res) => {
    const emails = req.body.emails;
    if (!Array.isArray(emails)) {
        return res.status(400).json({ error: 'emails array required' });
    }

    const script = path.join(__dirname, '../Application/api_scripts/process_queue.py');
    const py = spawn(pythonCmd, [script]);

    py.on('error', (err) => {
        console.error('❌ Failed to start process-queue script:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    });

    let output = '';
    let errOutput = '';
    py.stdout.on('data', (data) => { output += data; });
    py.stderr.on('data', (data) => { errOutput += data; });
    py.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: errOutput || 'Python script error' });
        }
        try {
            const parsed = JSON.parse(output);
            res.json(parsed);
        } catch (e) {
            res.status(500).json({ error: 'Failed to parse python output', details: output });
        }
    });

    py.stdin.write(JSON.stringify(emails));
    py.stdin.end();
});

// Retrieve stored full email for a transaction
app.get('/api/transactions/:id/email', (req, res) => {
    const { id } = req.params;
    db.get('SELECT full_email FROM transactions WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ full_email: row.full_email });
    });
});

// ✅ Update transaction amount
app.put('/api/transactions/:id/amount', (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;

    const query = 'UPDATE transactions SET amount = ? WHERE id = ?';

    db.run(query, [amount, id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: "Transaction not found" });
            return;
        }
        res.json({ message: `✅ Transaction ID ${id} amount updated to ${amount}` });
    });
});

// ✅ Update transaction description
app.put('/api/transactions/:id/description', (req, res) => {
    const { id } = req.params;
    const { description } = req.body;

    const query = 'UPDATE transactions SET description = ? WHERE id = ?';

    db.run(query, [description, id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: "Transaction not found" });
            return;
        }
        res.json({ message: `✅ Transaction ID ${id} description updated` });
    });
});

// ✅ Delete a transaction
app.delete('/api/transactions/:id', (req, res) => {
    const { id } = req.params;

    // Remove any tag links first
    db.run('DELETE FROM transaction_tags WHERE transaction_id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Now delete the transaction itself
        db.run('DELETE FROM transactions WHERE id = ?', [id], function (err2) {
            if (err2) {
                return res.status(500).json({ error: err2.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: "Transaction not found" });
            }
            res.json({ message: `✅ Transaction ID ${id} deleted` });
        });
    });
});



// Add these endpoints to your server.js

// ✅ Add a new category
app.post('/api/categories', (req, res) => {
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: "Category name is required" });
    }
    
    // Check if category already exists by checking existing transactions
    const checkQuery = "SELECT COUNT(*) as count FROM transactions WHERE category = ?";
    
    db.get(checkQuery, [name], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (row.count > 0) {
            res.status(400).json({ error: "Category already exists" });
            return;
        }
        
        res.json({ message: `✅ Category '${name}' is ready to use` });
    });
});

// ✅ Delete a category (and update transactions)
app.delete('/api/categories/:categoryName', (req, res) => {
    const { categoryName } = req.params;
    
    // Update all transactions with this category to have no category
    const updateQuery = "UPDATE transactions SET category = NULL WHERE category = ?";
    
    db.run(updateQuery, [categoryName], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        res.json({ 
            message: `✅ Category '${categoryName}' deleted and ${this.changes} transactions updated`,
            updatedTransactions: this.changes
        });
    });
});

// ✅ Add a new tag
app.post('/api/tags', (req, res) => {
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: "Tag name is required" });
    }
    
    // Check if tag already exists
    const checkQuery = "SELECT id FROM tags WHERE tag_name = ?";
    
    db.get(checkQuery, [name], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (row) {
            res.status(400).json({ error: "Tag already exists" });
            return;
        }
        
        // Insert new tag
        const insertQuery = "INSERT INTO tags (tag_name) VALUES (?)";
        
        db.run(insertQuery, [name], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({ 
                message: `✅ Tag '${name}' created successfully`,
                tagId: this.lastID
            });
        });
    });
});

// Apply a category to all transactions matching a keyword in the description
app.post('/api/apply-keyword-category', (req, res) => {
    const { keyword, category } = req.body;

    if (!keyword || !category) {
        return res.status(400).json({ error: "keyword and category are required" });
    }

    const like = `%${keyword}%`;
    const query = "UPDATE transactions SET category = ? WHERE description LIKE ?";

    db.run(query, [category, like], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const updated = this.changes;
        const ruleQuery = `INSERT INTO keyword_rules (keyword, category) VALUES (?, ?)
                           ON CONFLICT(keyword) DO UPDATE SET category = excluded.category`;

        db.run(ruleQuery, [keyword, category], (ruleErr) => {
            if (ruleErr) {
                return res.status(500).json({ error: ruleErr.message });
            }

            res.json({
                message: `✅ ${updated} transactions updated to category '${category}'`,
                updatedTransactions: updated
            });
        });
    });
});

// Apply tags to all transactions matching a keyword in the description
app.post('/api/apply-keyword-tags', async (req, res) => {
    try {
        const { keyword, tags } = req.body;

        if (!keyword || !Array.isArray(tags)) {
            return res.status(400).json({ error: "keyword and tags array are required" });
        }

        const like = `%${keyword}%`;

        // Get matching transaction IDs
        const transactions = await new Promise((resolve, reject) => {
            db.all('SELECT id FROM transactions WHERE description LIKE ?', [like], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => r.id));
            });
        });

        for (const tag of tags) {
            await new Promise((resolve, reject) => {
                db.run('INSERT OR IGNORE INTO tags (tag_name) VALUES (?)', [tag], err => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            const tagRow = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM tags WHERE tag_name = ?', [tag], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            const tagId = tagRow.id;

            for (const tId of transactions) {
                await new Promise((resolve, reject) => {
                    db.run(
                        'INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)',
                        [tId, tagId],
                        err => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }
        }

        const tagsString = tags.join(',');
        const ruleQuery = `INSERT INTO keyword_rules (keyword, tags) VALUES (?, ?)
                           ON CONFLICT(keyword) DO UPDATE SET tags = excluded.tags`;

        db.run(ruleQuery, [keyword, tagsString], (ruleErr) => {
            if (ruleErr) {
                console.error('Error saving keyword rule:', ruleErr);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({
                message: `✅ Tags applied to ${transactions.length} transactions`,
                updatedTransactions: transactions.length
            });
        });
    } catch (error) {
        console.error("Error applying keyword tags:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// ✅ Start the server
app.listen(port, () => {
    console.log(`Serveur actif à  http://localhost:${port}`);
});
