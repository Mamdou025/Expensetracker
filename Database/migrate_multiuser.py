"""
Multi-User Database Migration Script
Converts single-user ExpenseTracker to multi-user system
"""

import sqlite3
import os
from datetime import datetime

class MultiUserMigration:
    def __init__(self, db_path=None):
        if db_path is None:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
            self.db_path = os.path.join(base_dir, 'Database', 'transactions.db')
        else:
            self.db_path = db_path
    
    def create_multi_user_schema(self):
        """Create tables for multi-user support"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Create users table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        email TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        name TEXT NOT NULL,
                        email_credentials TEXT, -- Encrypted email credentials for bank access
                        bank_configurations TEXT, -- JSON of user's bank settings
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        last_login TIMESTAMP,
                        is_active BOOLEAN DEFAULT 1
                    )
                """)
                
                # Create user_email_accounts table for secure email storage
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS user_email_accounts (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        email_provider TEXT NOT NULL, -- gmail, outlook, etc.
                        encrypted_credentials TEXT NOT NULL,
                        is_primary BOOLEAN DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id)
                    )
                """)
                
                # Add user_id to existing transactions table
                try:
                    cursor.execute("ALTER TABLE transactions ADD COLUMN user_id INTEGER")
                    print("✅ Added user_id column to transactions table")
                except sqlite3.OperationalError as e:
                    if "duplicate column name" in str(e):
                        print("ℹ️ user_id column already exists in transactions table")
                    else:
                        raise
                
                # Create indexes for performance
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_user_transactions 
                    ON transactions(user_id, date DESC)
                """)
                
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_user_email_accounts 
                    ON user_email_accounts(user_id)
                """)
                
                # Create user_categories table for custom categories per user
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS user_categories (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        category_name TEXT NOT NULL,
                        color TEXT DEFAULT '#3B82F6',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id),
                        UNIQUE(user_id, category_name)
                    )
                """)
                
                # Create user_keyword_rules table for per-user categorization rules
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS user_keyword_rules (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        keyword TEXT NOT NULL,
                        category TEXT NOT NULL,
                        tags TEXT,
                        priority INTEGER DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id)
                    )
                """)
                
                # Update tags to be user-specific
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS user_tags (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        tag_name TEXT NOT NULL,
                        color TEXT DEFAULT '#10B981',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id),
                        UNIQUE(user_id, tag_name)
                    )
                """)
                
                # Create user_transaction_tags for many-to-many relationship
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS user_transaction_tags (
                        transaction_id INTEGER NOT NULL,
                        tag_id INTEGER NOT NULL,
                        user_id INTEGER NOT NULL,
                        PRIMARY KEY (transaction_id, tag_id),
                        FOREIGN KEY (transaction_id) REFERENCES transactions(id),
                        FOREIGN KEY (tag_id) REFERENCES user_tags(id),
                        FOREIGN KEY (user_id) REFERENCES users(id)
                    )
                """)
                
                # Create user_bank_configurations for per-user bank settings
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS user_bank_configurations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        bank_key TEXT NOT NULL, -- cibc_credit, etc.
                        bank_name TEXT NOT NULL,
                        sender_email TEXT NOT NULL,
                        keywords TEXT NOT NULL, -- JSON array
                        exclude_keywords TEXT, -- JSON array
                        regex_patterns TEXT, -- JSON object
                        is_active BOOLEAN DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id),
                        UNIQUE(user_id, bank_key)
                    )
                """)
                
                conn.commit()
                print("✅ Multi-user database schema created successfully")
                
        except Exception as e:
            print(f"❌ Error creating multi-user schema: {e}")
            raise
    
    def create_demo_user(self):
        """Create a demo user for existing data"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Check if demo user already exists
                cursor.execute("SELECT id FROM users WHERE email = ?", ('demo@expensetracker.com',))
                demo_user = cursor.fetchone()
                
                if demo_user:
                    demo_user_id = demo_user[0]
                    print(f"ℹ️ Demo user already exists with ID: {demo_user_id}")
                else:
                    # Create demo user (password: 'demo123')
                    import bcrypt
                    password_hash = bcrypt.hashpw('demo123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    
                    cursor.execute("""
                        INSERT INTO users (email, password_hash, name, created_at)
                        VALUES (?, ?, ?, ?)
                    """, ('demo@expensetracker.com', password_hash, 'Demo User', datetime.now().isoformat()))
                    
                    demo_user_id = cursor.lastrowid
                    print(f"✅ Created demo user with ID: {demo_user_id}")
                
                # Assign all existing transactions to demo user
                cursor.execute("UPDATE transactions SET user_id = ? WHERE user_id IS NULL", (demo_user_id,))
                updated_transactions = cursor.rowcount
                
                if updated_transactions > 0:
                    print(f"✅ Assigned {updated_transactions} existing transactions to demo user")
                
                # Create default categories for demo user
                default_categories = [
                    'Groceries', 'Fast Food', 'Restaurant', 'Transport', 'Shopping',
                    'Healthcare', 'Subscription', 'Banking', 'Transfer', 'Education',
                    'Entertainment', 'Home Improvement', 'Insurance'
                ]
                
                for category in default_categories:
                    cursor.execute("""
                        INSERT OR IGNORE INTO user_categories (user_id, category_name)
                        VALUES (?, ?)
                    """, (demo_user_id, category))
                
                conn.commit()
                return demo_user_id
                
        except Exception as e:
            print(f"❌ Error creating demo user: {e}")
            raise
    
    def migrate_existing_data(self):
        """Migrate existing single-user data to multi-user structure"""
        demo_user_id = self.create_demo_user()
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Migrate existing tags to user_tags
                cursor.execute("SELECT id, tag_name FROM tags")
                existing_tags = cursor.fetchall()
                
                tag_mapping = {}
                for tag_id, tag_name in existing_tags:
                    cursor.execute("""
                        INSERT OR IGNORE INTO user_tags (user_id, tag_name)
                        VALUES (?, ?)
                    """, (demo_user_id, tag_name))
                    
                    cursor.execute("""
                        SELECT id FROM user_tags WHERE user_id = ? AND tag_name = ?
                    """, (demo_user_id, tag_name))
                    
                    new_tag_id = cursor.fetchone()[0]
                    tag_mapping[tag_id] = new_tag_id
                
                # Migrate transaction_tags to user_transaction_tags
                cursor.execute("SELECT transaction_id, tag_id FROM transaction_tags")
                transaction_tags = cursor.fetchall()
                
                for transaction_id, old_tag_id in transaction_tags:
                    if old_tag_id in tag_mapping:
                        new_tag_id = tag_mapping[old_tag_id]
                        cursor.execute("""
                            INSERT OR IGNORE INTO user_transaction_tags (transaction_id, tag_id, user_id)
                            VALUES (?, ?, ?)
                        """, (transaction_id, new_tag_id, demo_user_id))
                
                # Migrate keyword rules if they exist
                try:
                    cursor.execute("SELECT keyword, category, tags FROM keyword_rules")
                    keyword_rules = cursor.fetchall()
                    
                    for keyword, category, tags in keyword_rules:
                        cursor.execute("""
                            INSERT OR IGNORE INTO user_keyword_rules (user_id, keyword, category, tags)
                            VALUES (?, ?, ?, ?)
                        """, (demo_user_id, keyword, category, tags))
                        
                except sqlite3.OperationalError:
                    print("ℹ️ No existing keyword_rules table to migrate")
                
                conn.commit()
                print("✅ Existing data migrated to multi-user structure")
                
        except Exception as e:
            print(f"❌ Error migrating existing data: {e}")
            raise
    
    def run_full_migration(self):
        """Run complete migration to multi-user system"""
        print("🔄 Starting multi-user migration...")
        print("=" * 50)
        
        # Backup existing database
        backup_path = self.db_path + f".backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        import shutil
        shutil.copy2(self.db_path, backup_path)
        print(f"✅ Database backed up to: {backup_path}")
        
        # Run migration steps
        self.create_multi_user_schema()
        self.migrate_existing_data()
        
        print("=" * 50)
        print("🎉 Multi-user migration completed successfully!")
        print(f"📊 Demo user credentials:")
        print(f"   Email: demo@expensetracker.com")
        print(f"   Password: demo123")
        print("=" * 50)

if __name__ == "__main__":
    try:
        # Install bcrypt if not available
        try:
            import bcrypt
        except ImportError:
            print("Installing bcrypt for password hashing...")
            import subprocess
            import sys
            subprocess.check_call([sys.executable, "-m", "pip", "install", "bcrypt"])
            import bcrypt
        
        migration = MultiUserMigration()
        migration.run_full_migration()
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise