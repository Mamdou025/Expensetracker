-- Email Forwarding Database Schema
-- Add these tables to your existing database

-- Table to store unique forwarding addresses for each user
CREATE TABLE IF NOT EXISTS forwarding_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    hash VARCHAR(16) UNIQUE NOT NULL,
    email_address VARCHAR(255) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_forwarding_hash ON forwarding_addresses(hash);
CREATE INDEX IF NOT EXISTS idx_forwarding_user ON forwarding_addresses(user_id);

-- Table to log email processing attempts
CREATE TABLE IF NOT EXISTS email_processing_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    bank_type VARCHAR(50),
    email_subject TEXT,
    transactions_found INTEGER DEFAULT 0,
    transactions_stored INTEGER DEFAULT 0,
    error_message TEXT,
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processing_time_ms INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_processing_log_user ON email_processing_log(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_log_date ON email_processing_log(processed_at);

-- Sample data insertion for testing
-- INSERT INTO forwarding_addresses (user_id, hash, email_address) 
-- VALUES (1, 'a1b2c3d4e5f6', 'transactions-a1b2c3d4e5f6@yourapp.com');