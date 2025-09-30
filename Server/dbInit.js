// Database initialization for authentication system
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../Database/transactions.db');

const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ Error opening database:', err.message);
                reject(err);
                return;
            }
            console.log('✅ Connected to SQLite database for initialization');
        });

        // Create users table
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                failed_login_attempts INTEGER DEFAULT 0,
                locked_until DATETIME NULL,
                email_verified BOOLEAN DEFAULT 0,
                verification_token TEXT NULL
            )
        `;

        // Create refresh tokens table
        const createRefreshTokensTable = `
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token_hash TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_revoked BOOLEAN DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `;

        // Create user settings table
        const createUserSettingsTable = `
            CREATE TABLE IF NOT EXISTS user_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                email_forwarding_enabled BOOLEAN DEFAULT 0,
                forwarding_address TEXT NULL,
                notification_preferences TEXT DEFAULT '{}',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `;

        // Execute table creation
        db.serialize(() => {
            db.run(createUsersTable, (err) => {
                if (err) {
                    console.error('❌ Error creating users table:', err.message);
                    reject(err);
                    return;
                }
                console.log('✅ Users table created/verified');
            });

            db.run(createRefreshTokensTable, (err) => {
                if (err) {
                    console.error('❌ Error creating refresh_tokens table:', err.message);
                    reject(err);
                    return;
                }
                console.log('✅ Refresh tokens table created/verified');
            });

            db.run(createUserSettingsTable, (err) => {
                if (err) {
                    console.error('❌ Error creating user_settings table:', err.message);
                    reject(err);
                    return;
                }
                console.log('✅ User settings table created/verified');
            });

            // Create demo user if it doesn't exist
            const createDemoUser = `
                INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, email_verified, is_active)
                VALUES (?, ?, ?, ?, 1, 1)
            `;

            // Demo password is "Demo123!" hashed with bcrypt
            const bcrypt = require('bcrypt');
            bcrypt.hash('Demo123!', 12, (err, hash) => {
                if (err) {
                    console.error('❌ Error hashing demo password:', err.message);
                    reject(err);
                    return;
                }

                db.run(createDemoUser, ['demo@expensetracker.com', hash, 'Demo', 'User'], (err) => {
                    if (err) {
                        console.error('❌ Error creating demo user:', err.message);
                        reject(err);
                        return;
                    }
                    console.log('✅ Demo user created/verified: demo@expensetracker.com');
                    
                    db.close((err) => {
                        if (err) {
                            console.error('❌ Error closing database:', err.message);
                            reject(err);
                        } else {
                            console.log('✅ Database initialization completed');
                            resolve();
                        }
                    });
                });
            });
        });
    });
};

module.exports = { initializeDatabase };