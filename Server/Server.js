const express = require('express');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');
const multer = require('multer');
const {
    buildRuntimeEnv,
    ensureSqliteDirectory,
    getClientBuildPath,
    getHost,
    getPort,
    getPythonCommand,
    getRepoRoot,
    validateRuntimeConfig,
} = require('./runtimeConfig');
const { setupAuth, requireAuth, requireOwner, OWNER_EMAIL } = require('./auth');

const app = express();
const runtimeEnv = buildRuntimeEnv(process.env);
validateRuntimeConfig(runtimeEnv);

const port = getPort(runtimeEnv);
const host = getHost(runtimeEnv);
const pythonCmd = getPythonCommand(runtimeEnv);
const repoRoot = getRepoRoot();
const dbPath = runtimeEnv.SQLITE_PATH;
const baseChildEnv = { ...runtimeEnv, SQLITE_PATH: dbPath };

function childEnvForUser(userId) {
    return { ...baseChildEnv, APP_USER_ID: userId || '' };
}

process.env.SQLITE_PATH = dbPath;
ensureSqliteDirectory(dbPath);

app.use(cors({
  origin: (origin, cb) => cb(null, origin || true),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Échec de la connexion à la base de données:', err.message);
    } else {
        console.log('✅ Connecté à la base de données SQLite à:', dbPath);
    }
});

function queryDb(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
}

async function startServer() {
    await setupAuth(app, db);

    // All /api/* routes below require an authenticated user. The setupAuth call
    // above already registered /api/login, /api/callback, /api/logout, and
    // /api/auth/user, so those are exempt.
    app.use('/api', requireAuth);

    // ===== Transactions =====
    app.get('/api/transactions', (req, res) => {
        const query = `
            SELECT t.id, t.amount, t.description, t.card_type, t.date, t.time, t.bank, t.category,
                   t.transaction_type,
                   COALESCE(GROUP_CONCAT(g.tag_name, ', '), '') AS tags
            FROM transactions t
            LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
            LEFT JOIN tags g ON tt.tag_id = g.id
            WHERE t.user_id = ?
            GROUP BY t.id, t.amount, t.description, t.card_type, t.date, t.time, t.bank, t.category, t.transaction_type
            ORDER BY t.date DESC;
        `;
        db.all(query, [req.userId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    app.get('/api/transactions/category/:category', (req, res) => {
        const category = req.params.category;
        const query = `
            SELECT t.id, t.amount, t.description, t.card_type, t.date, t.time, t.bank, t.category,
                   t.transaction_type,
                   COALESCE(GROUP_CONCAT(g.tag_name, ', '), '') AS tags
            FROM transactions t
            LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
            LEFT JOIN tags g ON tt.tag_id = g.id
            WHERE t.category = ? AND t.user_id = ?
            GROUP BY t.id;
        `;
        db.all(query, [category, req.userId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    app.get('/api/transactions/tag/:tag', (req, res) => {
        const tagName = req.params.tag;
        const query = `
            SELECT t.id, t.amount, t.description, t.card_type, t.date, t.time, t.bank, t.category,
                   t.transaction_type,
                   COALESCE(GROUP_CONCAT(g.tag_name, ', '), '') AS tags
            FROM transactions t
            JOIN transaction_tags tt ON t.id = tt.transaction_id
            JOIN tags g ON tt.tag_id = g.id
            WHERE g.tag_name = ? AND t.user_id = ?
            GROUP BY t.id;
        `;
        db.all(query, [tagName, req.userId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    app.post('/api/transactions', async (req, res) => {
        try {
            const { amount, description, card_type, date, bank, category = 'Uncategorized', tags = [] } = req.body;
            const rules = await queryDb(
                `SELECT keyword, category, tags FROM keyword_rules
                 WHERE user_id IS ? AND ? LIKE '%' || keyword || '%' COLLATE NOCASE`,
                [req.userId, description]
            );

            let finalCategory = category;
            const tagSet = new Set(Array.isArray(tags) ? tags : [tags]);
            const matchedRules = [];

            for (const rule of rules) {
                matchedRules.push({
                    keyword: rule.keyword,
                    category: rule.category || null,
                    tags: rule.tags ? rule.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                });
                if (rule.category) finalCategory = rule.category;
                if (rule.tags) {
                    for (const t of rule.tags.split(',')) if (t.trim()) tagSet.add(t.trim());
                }
            }

            const transactionId = await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO transactions (amount, description, card_type, date, bank, category, user_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [amount, description, card_type, date, bank, finalCategory, req.userId],
                    function (err) { err ? reject(err) : resolve(this.lastID); }
                );
            });

            const tagsArray = Array.from(tagSet);
            for (const tag of tagsArray) {
                await new Promise((resolve, reject) => {
                    db.run('INSERT OR IGNORE INTO tags (tag_name) VALUES (?)', [tag], (err) => err ? reject(err) : resolve());
                });
                const tagId = await new Promise((resolve, reject) => {
                    db.get('SELECT id FROM tags WHERE tag_name = ?', [tag], (err, row) => err ? reject(err) : resolve(row.id));
                });
                await new Promise((resolve, reject) => {
                    db.run('INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)',
                        [transactionId, tagId], (err) => err ? reject(err) : resolve());
                });
            }

            res.json({
                id: transactionId, amount, description, card_type, date, bank,
                category: finalCategory, tags: tagsArray, applied_rules: matchedRules,
            });
        } catch (error) {
            console.error('Error inserting transaction:', error);
            res.status(500).json({ error: 'Failed to insert transaction' });
        }
    });

    // ===== Tags =====
    app.get('/api/tags', (req, res) => {
        // Only return tags actually used by this user's transactions
        const query = `
            SELECT g.tag_name AS tag,
                   GROUP_CONCAT(t.description, ', ') AS transactions
            FROM tags g
            JOIN transaction_tags tt ON g.id = tt.tag_id
            JOIN transactions t ON tt.transaction_id = t.id
            WHERE t.user_id = ?
            GROUP BY g.tag_name;
        `;
        db.all(query, [req.userId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    app.get('/api/transactions/:id/tags', (req, res) => {
        const { id } = req.params;
        // Verify ownership of the transaction first
        db.get('SELECT id FROM transactions WHERE id = ? AND user_id = ?', [id, req.userId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Transaction not found' });
            db.all(
                `SELECT tag_name FROM tags
                 JOIN transaction_tags ON tags.id = transaction_tags.tag_id
                 WHERE transaction_tags.transaction_id = ?`,
                [id],
                (e2, rows) => {
                    if (e2) return res.status(500).json({ error: e2.message });
                    res.json(rows.map(r => r.tag_name));
                }
            );
        });
    });

    app.post('/api/transactions/:id/tags', async (req, res) => {
        try {
            const { id } = req.params;
            const { tag } = req.body;
            if (!tag) return res.status(400).json({ error: 'Tag is required' });

            const owns = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM transactions WHERE id = ? AND user_id = ?', [id, req.userId], (e, r) => e ? reject(e) : resolve(!!r));
            });
            if (!owns) return res.status(404).json({ error: 'Transaction not found' });

            const tagExists = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM tags WHERE tag_name = ?', [tag], (err, row) => err ? reject(err) : resolve(row));
            });

            let tagId;
            if (!tagExists) {
                tagId = await new Promise((resolve, reject) => {
                    db.run('INSERT INTO tags (tag_name) VALUES (?)', [tag], function (err) { err ? reject(err) : resolve(this.lastID); });
                });
            } else {
                tagId = tagExists.id;
            }

            const linkChanges = await new Promise((resolve, reject) => {
                db.run('INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)', [id, tagId], function (err) {
                    err ? reject(err) : resolve(this.changes);
                });
            });
            res.json({
                message: linkChanges ? 'Tag added successfully' : 'Tag already linked to transaction',
                alreadyLinked: linkChanges === 0,
            });
        } catch (error) {
            console.error('Error adding tag:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/api/transactions/:id/tags', async (req, res) => {
        try {
            const { id } = req.params;
            const { tag } = req.body;
            if (!tag) return res.status(400).json({ error: 'Tag is required' });
            const owns = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM transactions WHERE id = ? AND user_id = ?', [id, req.userId], (e, r) => e ? reject(e) : resolve(!!r));
            });
            if (!owns) return res.status(404).json({ error: 'Transaction not found' });
            await new Promise((resolve, reject) => {
                db.run(
                    `DELETE FROM transaction_tags
                     WHERE transaction_id = ? AND tag_id = (SELECT id FROM tags WHERE tag_name = ?)`,
                    [id, tag],
                    (err) => err ? reject(err) : resolve()
                );
            });
            res.json({ message: 'Tag removed successfully' });
        } catch (error) {
            console.error('Error removing tag:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/api/tags/:tagName', (req, res) => {
        const { tagName } = req.params;
        // Only remove the link from this user's transactions. Tag stays in the
        // global tags table since other users may use it.
        const query = `
            DELETE FROM transaction_tags
            WHERE tag_id = (SELECT id FROM tags WHERE tag_name = ?)
              AND transaction_id IN (SELECT id FROM transactions WHERE user_id = ?)
        `;
        db.run(query, [tagName, req.userId], function (err) {
            if (err) return res.status(500).json({ error: 'Failed to remove tag links' });
            res.json({ message: `✅ Tag '${tagName}' removed from your transactions`, changes: this.changes });
        });
    });

    // ===== Updates / Delete =====
    app.put('/api/transactions/:id/category', (req, res) => {
        const { id } = req.params;
        const { category } = req.body;
        db.run('UPDATE transactions SET category = ? WHERE id = ? AND user_id = ?', [category, id, req.userId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Transaction not found' });
            res.json({ message: `✅ Transaction ID ${id} updated to category '${category}'` });
        });
    });

    app.put('/api/transactions/:id/amount', (req, res) => {
        const { id } = req.params;
        const { amount } = req.body;
        db.run('UPDATE transactions SET amount = ? WHERE id = ? AND user_id = ?', [amount, id, req.userId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Transaction not found' });
            res.json({ message: 'Updated' });
        });
    });

    app.put('/api/transactions/:id/description', (req, res) => {
        const { id } = req.params;
        const { description } = req.body;
        db.run('UPDATE transactions SET description = ? WHERE id = ? AND user_id = ?', [description, id, req.userId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Transaction not found' });
            res.json({ message: 'Updated' });
        });
    });

    app.delete('/api/transactions/:id', (req, res) => {
        const { id } = req.params;
        db.get('SELECT id FROM transactions WHERE id = ? AND user_id = ?', [id, req.userId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Transaction not found' });
            db.serialize(() => {
                db.run('DELETE FROM transaction_tags WHERE transaction_id = ?', [id]);
                db.run('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, req.userId], function (e2) {
                    if (e2) return res.status(500).json({ error: e2.message });
                    res.json({ message: 'Deleted' });
                });
            });
        });
    });

    // ===== Dashboard / Analytics =====
    app.get('/api/dashboard/stats', (req, res) => {
        const query = `
            SELECT
                COUNT(*) AS totalTransactions,
                COALESCE(SUM(amount), 0) AS totalAmount,
                COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) AS totalIncome,
                COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) AS totalExpense,
                COALESCE(AVG(amount), 0) AS avgTransaction
            FROM transactions WHERE user_id = ?`;
        db.get(query, [req.userId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
                totalTransactions: Number(row?.totalTransactions || 0),
                totalAmount: Number(row?.totalAmount || 0),
                totalIncome: Number(row?.totalIncome || 0),
                totalExpense: Number(row?.totalExpense || 0),
                avgTransaction: Number(row?.avgTransaction || 0),
            });
        });
    });

    app.get('/api/dashboard/monthly-spending', (req, res) => {
        db.all(
            `SELECT strftime('%Y-%m', date) as month, SUM(amount) as total_amount, COUNT(*) as transaction_count
             FROM transactions WHERE user_id = ?
             GROUP BY strftime('%Y-%m', date) ORDER BY month DESC LIMIT 12`,
            [req.userId],
            (err, rows) => err ? res.status(500).json({ error: err.message }) : res.json(rows)
        );
    });

    app.get('/api/analytics/category-breakdown', (req, res) => {
        const { startDate, endDate } = req.query;
        let q = `SELECT category, COUNT(*) as transaction_count, SUM(ABS(amount)) as total_amount, AVG(ABS(amount)) as avg_amount
                 FROM transactions WHERE user_id = ?`;
        const params = [req.userId];
        if (startDate && endDate) { q += ' AND date BETWEEN ? AND ?'; params.push(startDate, endDate); }
        q += ' GROUP BY category ORDER BY total_amount DESC';
        db.all(q, params, (err, rows) => err ? res.status(500).json({ error: err.message }) : res.json(rows));
    });

    app.get('/api/categories', (req, res) => {
        db.all(
            `SELECT category as name, COUNT(*) as transaction_count, SUM(ABS(amount)) as total_amount
             FROM transactions WHERE category IS NOT NULL AND user_id = ?
             GROUP BY category`,
            [req.userId],
            (err, rows) => err ? res.status(500).json({ error: err.message }) : res.json(rows)
        );
    });

    app.get('/api/tags/stats', (req, res) => {
        db.all(
            `SELECT g.tag_name as name, COUNT(tt.transaction_id) as usage_count, SUM(ABS(t.amount)) as total_amount
             FROM tags g
             JOIN transaction_tags tt ON g.id = tt.tag_id
             JOIN transactions t ON tt.transaction_id = t.id
             WHERE t.user_id = ?
             GROUP BY g.tag_name ORDER BY usage_count DESC`,
            [req.userId],
            (err, rows) => err ? res.status(500).json({ error: err.message }) : res.json(rows)
        );
    });

    // ===== Keyword rules (per user) =====
    app.get('/api/keyword-rules', (req, res) => {
        db.all('SELECT keyword, category, tags FROM keyword_rules WHERE user_id IS ?', [req.userId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows.map(r => ({
                keyword: r.keyword,
                category: r.category,
                tags: r.tags ? r.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            })));
        });
    });

    app.post('/api/keyword-rules', (req, res) => {
        const { keyword, category, tags } = req.body;
        if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
            return res.status(400).json({ error: 'Keyword is required' });
        }
        const tagsStr = Array.isArray(tags) ? tags.join(',') : (typeof tags === 'string' ? tags : null);
        db.run(
            'INSERT INTO keyword_rules (user_id, keyword, category, tags) VALUES (?, ?, ?, ?)',
            [req.userId, keyword.trim(), category || null, tagsStr],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Keyword rule already exists' });
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ message: 'Rule created', keyword });
            }
        );
    });

    app.put('/api/keyword-rules/:keyword', (req, res) => {
        const { keyword } = req.params;
        const { category, tags } = req.body;
        const updates = [];
        const params = [];
        if (category !== undefined) { updates.push('category = ?'); params.push(category); }
        if (tags !== undefined) {
            const tagsStr = Array.isArray(tags) ? tags.join(',') : tags;
            updates.push('tags = ?'); params.push(tagsStr);
        }
        if (updates.length === 0) return res.status(400).json({ error: 'Category or tags required' });
        params.push(keyword, req.userId);
        db.run(`UPDATE keyword_rules SET ${updates.join(', ')} WHERE keyword = ? AND user_id IS ?`, params, function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Keyword rule not found' });
            res.json({ message: 'Rule updated' });
        });
    });

    app.delete('/api/keyword-rules/:keyword', (req, res) => {
        const { keyword } = req.params;
        db.run('DELETE FROM keyword_rules WHERE keyword = ? AND user_id IS ?', [keyword, req.userId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Keyword rule not found' });
            res.json({ message: 'Rule deleted' });
        });
    });

    // ===== Email extraction — owner only (uses owner's Gmail credentials) =====
    app.post('/api/extract-emails', requireOwner, (req, res) => {
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

        function formatDate(iso) {
            const [y, m, d] = iso.split('-');
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            return `${d}-${months[parseInt(m, 10) - 1]}-${y}`;
        }
        const script = path.join(__dirname, '../Application/api_scripts/extract_emails.py');
        const py = spawn(pythonCmd, [script, formatDate(startDate), formatDate(endDate)], {
            cwd: repoRoot, env: childEnvForUser(req.userId),
        });
        py.on('error', (err) => { if (!res.headersSent) res.status(500).json({ error: err.message }); });
        let output = '', errOutput = '';
        py.stdout.on('data', (d) => { output += d; });
        py.stderr.on('data', (d) => { errOutput += d; });
        py.on('close', (code) => {
            if (code !== 0) return res.status(500).json({ error: errOutput || 'Python script error' });
            try {
                const parsed = JSON.parse(output);
                const filtered = parsed.filter(item => !isNaN(parseFloat(item?.transaction?.amount)));
                res.json(filtered);
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse python output', details: output });
            }
        });
    });

    app.post('/api/process-queue', requireOwner, (req, res) => {
        const emails = req.body.emails;
        if (!Array.isArray(emails)) return res.status(400).json({ error: 'emails array required' });
        const script = path.join(__dirname, '../Application/api_scripts/process_queue.py');
        const py = spawn(pythonCmd, [script], { cwd: repoRoot, env: childEnvForUser(req.userId) });
        py.on('error', (err) => { if (!res.headersSent) res.status(500).json({ error: err.message }); });
        let output = '', errOutput = '';
        py.stdout.on('data', (d) => { output += d; });
        py.stderr.on('data', (d) => { errOutput += d; });
        py.on('close', (code) => {
            if (code !== 0) return res.status(500).json({ error: errOutput || 'Python script error' });
            try { res.json(JSON.parse(output)); }
            catch (e) { res.status(500).json({ error: 'Failed to parse python output', details: output }); }
        });
        py.stdin.write(JSON.stringify(emails));
        py.stdin.end();
    });

    // ===== PDF Import =====
    const uploadsDir = path.join(repoRoot, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const pdfUpload = multer({
        storage: multer.diskStorage({
            destination: uploadsDir,
            filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
        }),
        limits: { fileSize: 20 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (file.mimetype === 'application/pdf') cb(null, true);
            else cb(new Error('Only PDF files are accepted'));
        },
    });

    app.get('/api/inbox-info', requireOwner, (req, res) => {
        res.json({
            address: process.env.EMAIL_USER || null,
            configured: !!process.env.EMAIL_USER,
        });
    });

    // ---------- User bank accounts (per-user connected institutions) ----------
    app.get('/api/user-bank-accounts', (req, res) => {
        db.all(
            `SELECT id, bank_id, bank_name, product, nickname, ingest_method, status, settings_json, created_at
             FROM user_bank_accounts WHERE user_id = ?
             ORDER BY datetime(created_at) DESC`,
            [req.userId],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ accounts: rows.map(r => ({
                    ...r,
                    settings: r.settings_json ? JSON.parse(r.settings_json) : null,
                })) });
            }
        );
    });

    app.post('/api/user-bank-accounts', (req, res) => {
        const { bank_id, bank_name, product, nickname, ingest_method, settings } = req.body || {};
        if (!bank_id || !bank_name) {
            return res.status(400).json({ error: 'bank_id and bank_name are required' });
        }
        const method = ingest_method || 'pdf';
        if (!['pdf', 'email_forward', 'gmail_oauth'].includes(method)) {
            return res.status(400).json({ error: 'invalid ingest_method' });
        }
        db.run(
            `INSERT INTO user_bank_accounts
                (user_id, bank_id, bank_name, product, nickname, ingest_method, settings_json)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                req.userId, bank_id, bank_name,
                product || null, nickname || null, method,
                settings ? JSON.stringify(settings) : null,
            ],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID });
            }
        );
    });

    app.patch('/api/user-bank-accounts/:id', (req, res) => {
        const allowed = ['product', 'nickname', 'ingest_method', 'status'];
        const updates = [], values = [];
        for (const k of allowed) {
            if (k in (req.body || {})) { updates.push(`${k} = ?`); values.push(req.body[k]); }
        }
        if ('settings' in (req.body || {})) {
            updates.push('settings_json = ?');
            values.push(req.body.settings ? JSON.stringify(req.body.settings) : null);
        }
        if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
        values.push(req.params.id, req.userId);
        db.run(
            `UPDATE user_bank_accounts SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            values,
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                if (!this.changes) return res.status(404).json({ error: 'Account not found' });
                res.json({ ok: true });
            }
        );
    });

    app.delete('/api/user-bank-accounts/:id', (req, res) => {
        db.run(
            `DELETE FROM user_bank_accounts WHERE id = ? AND user_id = ?`,
            [req.params.id, req.userId],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                if (!this.changes) return res.status(404).json({ error: 'Account not found' });
                res.json({ ok: true });
            }
        );
    });

    // ---------- Email samples (forwarded bank emails awaiting a parser) ----------
    app.get('/api/email-samples', (req, res) => {
        db.all(
            `SELECT id, bank_name, sender, subject, received_at, status,
                    LENGTH(body_text) AS body_text_length,
                    LENGTH(body_html) AS body_html_length,
                    created_at
             FROM email_samples WHERE user_id = ?
             ORDER BY datetime(COALESCE(received_at, created_at)) DESC`,
            [req.userId],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ samples: rows });
            }
        );
    });

    app.get('/api/email-samples/:id', (req, res) => {
        db.get(
            `SELECT * FROM email_samples WHERE id = ? AND user_id = ?`,
            [req.params.id, req.userId],
            (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!row) return res.status(404).json({ error: 'Sample not found' });
                res.json(row);
            }
        );
    });

    app.post('/api/email-samples', (req, res) => {
        const { bank_name, sender, subject, received_at, body_text, body_html, notes } = req.body || {};
        if (!body_text && !body_html) {
            return res.status(400).json({ error: 'Provide at least body_text or body_html' });
        }
        db.run(
            `INSERT INTO email_samples
                (user_id, bank_name, sender, subject, received_at, body_text, body_html, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.userId,
                bank_name || null,
                sender || null,
                subject || null,
                received_at || null,
                body_text || null,
                body_html || null,
                notes || null,
            ],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID });
            }
        );
    });

    app.patch('/api/email-samples/:id', (req, res) => {
        const allowed = ['bank_name', 'sender', 'subject', 'received_at', 'status', 'notes'];
        const updates = [], values = [];
        for (const k of allowed) {
            if (k in (req.body || {})) {
                updates.push(`${k} = ?`);
                values.push(req.body[k]);
            }
        }
        if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
        values.push(req.params.id, req.userId);
        db.run(
            `UPDATE email_samples SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            values,
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                if (!this.changes) return res.status(404).json({ error: 'Sample not found' });
                res.json({ ok: true });
            }
        );
    });

    app.delete('/api/email-samples/:id', (req, res) => {
        db.run(
            `DELETE FROM email_samples WHERE id = ? AND user_id = ?`,
            [req.params.id, req.userId],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                if (!this.changes) return res.status(404).json({ error: 'Sample not found' });
                res.json({ ok: true });
            }
        );
    });

    app.get('/api/pdf-templates', (req, res) => {
        const script = path.join(__dirname, '../Application/api_scripts/list_pdf_templates.py');
        const py = spawn(pythonCmd, [script], { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
        let stdout = '', stderr = '';
        py.stdout.on('data', (d) => stdout += d.toString());
        py.stderr.on('data', (d) => stderr += d.toString());
        py.on('close', (code) => {
            if (code !== 0) {
                console.error('pdf-templates script failed:', stderr);
                return res.status(500).json({ error: 'Failed to load templates' });
            }
            try { res.json({ templates: JSON.parse(stdout) }); }
            catch (e) { res.status(500).json({ error: 'Invalid template data' }); }
        });
        py.on('error', (err) => res.status(500).json({ error: 'Failed to start template listing' }));
    });

    app.post('/api/import-pdf', pdfUpload.single('file'), (req, res) => {
        if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });
        const filepath = req.file.path;
        const script = path.join(__dirname, '../Application/api_scripts/parse_pdf.py');
        const py = spawn(pythonCmd, [script], { cwd: repoRoot, env: childEnvForUser(req.userId) });
        py.on('error', (err) => { if (!res.headersSent) res.status(500).json({ error: err.message }); });
        let output = '', errOutput = '';
        py.stdout.on('data', (d) => { output += d; });
        py.stderr.on('data', (d) => { errOutput += d; });
        py.on('close', (code) => {
            try { fs.unlinkSync(filepath); } catch (_) {}
            if (code !== 0) return res.status(500).json({ error: errOutput || 'PDF parsing error' });
            try {
                const parsed = JSON.parse(output);
                if (parsed.error) return res.status(400).json(parsed);
                const txns = parsed.transactions || [];
                if (txns.length === 0) return res.json(parsed);

                function normDesc(desc) {
                    if (!desc) return '';
                    let d = desc.toLowerCase().trim();
                    d = d.replace(/^retail purchase\s+\d+\s+/i, '');
                    d = d.replace(/^e-transfer\s+\d+\s*/i, 'e-transfer ');
                    d = d.replace(/\s+/g, ' ');
                    return d;
                }
                function addDays(dateStr, n) {
                    const dt = new Date(dateStr + 'T00:00:00');
                    dt.setDate(dt.getDate() + n);
                    return dt.toISOString().slice(0, 10);
                }

                const sourceRef = parsed.document_id || '';
                db.all(
                    `SELECT source_ref FROM transactions WHERE source_ref = ? AND user_id = ? LIMIT 1`,
                    [sourceRef, req.userId],
                    (refErr, refRows) => {
                        const documentAlreadyImported = !refErr && refRows && refRows.length > 0;
                        if (documentAlreadyImported) {
                            parsed.document_already_imported = true;
                            parsed.duplicate_count = txns.length;
                            txns.forEach(t => { t.is_duplicate = true; });
                            return res.json(parsed);
                        }
                        const dates = [...new Set(txns.map(t => t.date))];
                        const allDates = new Set();
                        dates.forEach(d => {
                            for (let offset = -2; offset <= 2; offset++) allDates.add(addDays(d, offset));
                        });
                        const expandedDates = [...allDates];
                        const datePlaceholders = expandedDates.map(() => '?').join(', ');
                        db.all(
                            `SELECT date, amount, bank, description, source_type FROM transactions
                             WHERE date IN (${datePlaceholders}) AND user_id = ?`,
                            [...expandedDates, req.userId],
                            (err, existingRows) => {
                                if (err) return res.json(parsed);
                                const existingList = (existingRows || []).map(row => ({
                                    date: row.date, amount: row.amount, bank: row.bank,
                                    description: row.description, source_type: row.source_type || 'unknown',
                                    normDesc: normDesc(row.description),
                                }));
                                let duplicateCount = 0;
                                txns.forEach(t => {
                                    const tNorm = normDesc(t.description);
                                    const tBank = t.bank || 'Unknown';
                                    const tAmount = parseFloat(t.amount);
                                    const tDate = t.date;
                                    const match = existingList.find(ex => {
                                        if (Math.abs(ex.amount - tAmount) > 0.01) return false;
                                        if (ex.bank !== tBank) return false;
                                        const dayDiff = Math.abs((new Date(tDate) - new Date(ex.date)) / 86400000);
                                        if (dayDiff > 2) return false;
                                        if (ex.normDesc === tNorm) return true;
                                        if (ex.normDesc.length > 0 && tNorm.length > 0 &&
                                            (ex.normDesc.includes(tNorm) || tNorm.includes(ex.normDesc))) return true;
                                        return false;
                                    });
                                    if (match) {
                                        t.is_duplicate = true;
                                        t.existing_match = { date: match.date, amount: match.amount,
                                            description: match.description, source_type: match.source_type, bank: match.bank };
                                        duplicateCount++;
                                    } else {
                                        t.is_duplicate = false;
                                    }
                                });
                                parsed.duplicate_count = duplicateCount;
                                res.json(parsed);
                            }
                        );
                    }
                );
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse python output', details: output });
            }
        });
        py.stdin.write(JSON.stringify({ filepath }));
        py.stdin.end();
    });

    app.post('/api/import-pdf/confirm', (req, res) => {
        const { transactions } = req.body;
        if (!Array.isArray(transactions) || transactions.length === 0) {
            return res.status(400).json({ error: 'transactions array required' });
        }
        const script = path.join(__dirname, '../Application/api_scripts/import_pdf_confirm.py');
        const py = spawn(pythonCmd, [script], { cwd: repoRoot, env: childEnvForUser(req.userId) });
        py.on('error', (err) => { if (!res.headersSent) res.status(500).json({ error: err.message }); });
        let output = '', errOutput = '';
        py.stdout.on('data', (d) => { output += d; });
        py.stderr.on('data', (d) => { errOutput += d; });
        py.on('close', (code) => {
            if (code !== 0) return res.status(500).json({ error: errOutput || 'Import confirmation error' });
            try { res.json(JSON.parse(output)); }
            catch (e) { res.status(500).json({ error: 'Failed to parse python output', details: output }); }
        });
        py.stdin.write(JSON.stringify(transactions));
        py.stdin.end();
    });

    // ===== Chat (uses authenticated user's data context) =====
    const OpenAI = require('openai');
    const openaiClient = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });

    async function gatherFinancialContext(userId) {
        const [summary, categories, banks, tags, recentTxns, monthlySpending] = await Promise.all([
            queryDb(`SELECT COUNT(*) as total_transactions,
                ROUND(SUM(CASE WHEN transaction_type='expense' THEN amount ELSE 0 END),2) as total_expenses,
                ROUND(SUM(CASE WHEN transaction_type='income' THEN amount ELSE 0 END),2) as total_income,
                MIN(date) as earliest_date, MAX(date) as latest_date
                FROM transactions WHERE user_id = ?`, [userId]),
            queryDb(`SELECT category, COUNT(*) as count, ROUND(SUM(amount),2) as total
                FROM transactions WHERE transaction_type='expense' AND user_id = ?
                GROUP BY category ORDER BY total DESC LIMIT 20`, [userId]),
            queryDb(`SELECT bank, COUNT(*) as count, ROUND(SUM(amount),2) as total
                FROM transactions WHERE user_id = ? GROUP BY bank ORDER BY total DESC`, [userId]),
            queryDb(`SELECT g.tag_name, COUNT(*) as count, ROUND(SUM(t.amount),2) as total
                FROM transaction_tags tt
                JOIN tags g ON tt.tag_id = g.id
                JOIN transactions t ON tt.transaction_id = t.id
                WHERE t.user_id = ?
                GROUP BY g.tag_name ORDER BY total DESC`, [userId]),
            queryDb(`SELECT date, amount, description, bank, category, transaction_type
                FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT 30`, [userId]),
            queryDb(`SELECT strftime('%Y-%m', date) as month,
                ROUND(SUM(CASE WHEN transaction_type='expense' THEN amount ELSE 0 END),2) as expenses,
                ROUND(SUM(CASE WHEN transaction_type='income' THEN amount ELSE 0 END),2) as income
                FROM transactions WHERE user_id = ? GROUP BY month ORDER BY month DESC LIMIT 12`, [userId]),
        ]);
        return `FINANCIAL DATABASE SUMMARY:
${JSON.stringify(summary[0])}

TOP SPENDING CATEGORIES:
${JSON.stringify(categories)}

BANKS/ACCOUNTS:
${JSON.stringify(banks)}

TAGS:
${JSON.stringify(tags)}

MONTHLY SPENDING (last 12 months):
${JSON.stringify(monthlySpending)}

RECENT TRANSACTIONS (last 30):
${JSON.stringify(recentTxns)}`;
    }

    app.post('/api/chat', async (req, res) => {
        try {
            const { message, history = [] } = req.body;
            if (!message) return res.status(400).json({ error: 'Message is required' });
            const financialContext = await gatherFinancialContext(req.userId);
            let additionalData = '';
            const lowerMsg = message.toLowerCase();

            if (lowerMsg.includes('subscri') || lowerMsg.includes('abonn') || lowerMsg.includes('recurring')) {
                const recurring = await queryDb(`SELECT description, COUNT(*) as occurrences, ROUND(AVG(amount),2) as avg_amount, bank
                    FROM transactions WHERE transaction_type='expense' AND user_id = ?
                    GROUP BY description HAVING COUNT(*) >= 3 ORDER BY occurrences DESC LIMIT 20`, [req.userId]);
                additionalData += `\nRECURRING TRANSACTIONS:\n${JSON.stringify(recurring)}`;
            }
            if (lowerMsg.includes('merchant') || lowerMsg.includes('store') || lowerMsg.includes('where') || lowerMsg.includes('magasin')) {
                const merchants = await queryDb(`SELECT description, COUNT(*) as visits, ROUND(SUM(amount),2) as total_spent
                    FROM transactions WHERE transaction_type='expense' AND user_id = ?
                    GROUP BY description ORDER BY total_spent DESC LIMIT 20`, [req.userId]);
                additionalData += `\nTOP MERCHANTS:\n${JSON.stringify(merchants)}`;
            }
            if (lowerMsg.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/i)) {
                const allMonthly = await queryDb(`SELECT strftime('%Y-%m', date) as month, category, ROUND(SUM(amount),2) as total
                    FROM transactions WHERE transaction_type='expense' AND user_id = ?
                    GROUP BY month, category ORDER BY month DESC, total DESC`, [req.userId]);
                additionalData += `\nMONTHLY CATEGORY BREAKDOWN:\n${JSON.stringify(allMonthly)}`;
            }
            if (lowerMsg.includes('interest') || lowerMsg.includes('intérêt') || lowerMsg.includes('interet')) {
                const interest = await queryDb(`SELECT date, amount, description, bank
                    FROM transactions t
                    JOIN transaction_tags tt ON t.id = tt.transaction_id
                    JOIN tags g ON tt.tag_id = g.id
                    WHERE g.tag_name = 'Interest' AND t.user_id = ?
                    ORDER BY date DESC`, [req.userId]);
                additionalData += `\nINTEREST CHARGES:\n${JSON.stringify(interest)}`;
            }
            if (lowerMsg.includes('rent') || lowerMsg.includes('loyer')) {
                const rent = await queryDb(`SELECT date, amount, description, bank
                    FROM transactions WHERE category = 'Rent' AND user_id = ?
                    ORDER BY date DESC`, [req.userId]);
                additionalData += `\nRENT PAYMENTS:\n${JSON.stringify(rent)}`;
            }

            const systemPrompt = `You are a smart personal finance assistant analyzing a user's transaction data. You have access to their complete financial database.

Answer questions clearly and concisely. Use numbers and dates when relevant. Give actionable insights when appropriate. If the user asks in French, respond in French.

${financialContext}
${additionalData}

Important: All amounts are in Canadian dollars (CAD). When showing amounts, use $ symbol. Format dates nicely. Round amounts to 2 decimal places.`;

            const messages = [
                { role: 'system', content: systemPrompt },
                ...history.map(h => ({ role: h.role, content: h.content })),
                { role: 'user', content: message },
            ];

            const contextQueries = [];
            if (additionalData.includes('RECURRING')) contextQueries.push('recurring');
            if (additionalData.includes('MERCHANTS')) contextQueries.push('merchants');
            if (additionalData.includes('MONTHLY CATEGORY')) contextQueries.push('monthly_breakdown');
            if (additionalData.includes('INTEREST')) contextQueries.push('interest');
            if (additionalData.includes('RENT')) contextQueries.push('rent');

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const startTime = Date.now();
            const modelName = 'gpt-5-mini';
            const stream = await openaiClient.chat.completions.create({
                model: modelName, messages, stream: true,
                stream_options: { include_usage: true }, max_completion_tokens: 8192,
            });

            let responseLength = 0, usageData = null;
            for await (const chunk of stream) {
                const content = chunk.choices?.[0]?.delta?.content || '';
                if (content) {
                    responseLength += content.length;
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
                if (chunk.usage) usageData = chunk.usage;
            }

            const durationMs = Date.now() - startTime;
            const promptTokens = usageData?.prompt_tokens || 0;
            const completionTokens = usageData?.completion_tokens || 0;
            const totalTokens = usageData?.total_tokens || (promptTokens + completionTokens);
            const estimatedCost = (promptTokens * 0.00015 + completionTokens * 0.0006) / 1000;

            res.write(`data: ${JSON.stringify({ done: true, usage: {
                prompt_tokens: promptTokens, completion_tokens: completionTokens,
                total_tokens: totalTokens, duration_ms: durationMs, model: modelName, estimated_cost: estimatedCost,
            }})}\n\n`);
            res.end();

            db.run(
                `INSERT INTO chat_usage (model, prompt_tokens, completion_tokens, total_tokens, user_message, response_length, duration_ms, context_queries, estimated_cost, user_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [modelName, promptTokens, completionTokens, totalTokens, message.substring(0, 500), responseLength, durationMs, contextQueries.join(','), estimatedCost, req.userId],
                (err) => { if (err) console.error('Failed to log chat usage:', err.message); }
            );
        } catch (error) {
            console.error('Chat error:', error);
            if (res.headersSent) {
                res.write(`data: ${JSON.stringify({ error: 'Chat failed' })}\n\n`);
                res.end();
            } else {
                res.status(500).json({ error: 'Chat failed', details: error.message });
            }
        }
    });

    app.get('/api/chat/usage', async (req, res) => {
        try {
            const uid = req.userId;
            const [summary, daily, byModel, recentSessions, hourly] = await Promise.all([
                queryDb(`SELECT COUNT(*) as total_requests,
                    COALESCE(SUM(prompt_tokens), 0) as total_prompt_tokens,
                    COALESCE(SUM(completion_tokens), 0) as total_completion_tokens,
                    COALESCE(SUM(total_tokens), 0) as total_tokens,
                    ROUND(AVG(total_tokens), 0) as avg_tokens_per_request,
                    ROUND(AVG(duration_ms), 0) as avg_duration_ms,
                    ROUND(SUM(estimated_cost), 6) as total_estimated_cost,
                    COALESCE(SUM(response_length), 0) as total_response_chars,
                    MIN(timestamp) as first_usage, MAX(timestamp) as last_usage
                    FROM chat_usage WHERE user_id = ?`, [uid]),
                queryDb(`SELECT date(timestamp) as day, COUNT(*) as requests,
                    SUM(total_tokens) as tokens, SUM(prompt_tokens) as prompt_tokens,
                    SUM(completion_tokens) as completion_tokens,
                    ROUND(SUM(estimated_cost), 6) as cost, ROUND(AVG(duration_ms), 0) as avg_duration
                    FROM chat_usage WHERE user_id = ? GROUP BY day ORDER BY day DESC LIMIT 30`, [uid]),
                queryDb(`SELECT model, COUNT(*) as requests, SUM(total_tokens) as tokens,
                    ROUND(SUM(estimated_cost), 6) as cost
                    FROM chat_usage WHERE user_id = ? GROUP BY model`, [uid]),
                queryDb(`SELECT id, timestamp, model, prompt_tokens, completion_tokens, total_tokens,
                    user_message, response_length, duration_ms, context_queries, estimated_cost
                    FROM chat_usage WHERE user_id = ? ORDER BY id DESC LIMIT 50`, [uid]),
                queryDb(`SELECT strftime('%H', timestamp) as hour, COUNT(*) as requests, SUM(total_tokens) as tokens
                    FROM chat_usage WHERE user_id = ? GROUP BY hour ORDER BY hour`, [uid]),
            ]);
            const thisMonth = await queryDb(`SELECT COUNT(*) as requests,
                COALESCE(SUM(total_tokens), 0) as tokens, ROUND(SUM(estimated_cost), 6) as cost
                FROM chat_usage WHERE user_id = ? AND strftime('%Y-%m', timestamp) = strftime('%Y-%m', 'now')`, [uid]);
            const today = await queryDb(`SELECT COUNT(*) as requests,
                COALESCE(SUM(total_tokens), 0) as tokens, ROUND(SUM(estimated_cost), 6) as cost
                FROM chat_usage WHERE user_id = ? AND date(timestamp) = date('now')`, [uid]);
            const contextStats = await queryDb(`SELECT context_queries, COUNT(*) as count
                FROM chat_usage WHERE user_id = ? AND context_queries IS NOT NULL AND context_queries != ''
                GROUP BY context_queries ORDER BY count DESC LIMIT 10`, [uid]);
            res.json({ summary: summary[0], today: today[0], thisMonth: thisMonth[0], daily, byModel, recentSessions, hourly, contextStats });
        } catch (error) {
            console.error('Usage stats error:', error);
            res.status(500).json({ error: 'Failed to fetch usage stats' });
        }
    });

    app.delete('/api/chat/usage', (req, res) => {
        db.run('DELETE FROM chat_usage WHERE user_id = ?', [req.userId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ deleted: this.changes });
        });
    });

    // ===== Static React build (must be last) =====
    const clientBuildPath = getClientBuildPath();
    const clientIndexPath = path.join(clientBuildPath, 'index.html');
    if (fs.existsSync(clientIndexPath)) {
        app.use(express.static(clientBuildPath));
        app.get('*', (req, res, next) => {
            if (req.path.startsWith('/api/')) return next();
            return res.sendFile(clientIndexPath);
        });
    }

    app.listen(port, host, () => {
        console.log(`Serveur actif sur ${host}:${port}`);
        console.log(`Base SQLite active: ${dbPath}`);
        if (fs.existsSync(clientIndexPath)) console.log(`Client React servi depuis: ${clientBuildPath}`);
    });
}

startServer().catch((err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});
