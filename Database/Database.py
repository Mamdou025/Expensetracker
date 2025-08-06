import sqlite3
import os

def _check_and_update_columns(cursor):
    """Ensure the transactions table has all required columns."""
    required = {
        "time": "TEXT DEFAULT NULL",
        "bank": "TEXT NOT NULL",
        "full_email": "TEXT DEFAULT 'No email content'",
        "category": "TEXT DEFAULT 'Uncategorized'",
        "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    }

    cursor.execute("PRAGMA table_info(transactions)")
    existing = {row[1] for row in cursor.fetchall()}

    for col, definition in required.items():
        if col not in existing:
            cursor.execute(
                f"ALTER TABLE transactions ADD COLUMN {col} {definition}"
            )
            print(f"➡️ Added missing column '{col}' to transactions table")

def create_database():
    # ✅ Get the absolute path of the 'Database' folder
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "transactions.db")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # ✅ Create transactions table --test Mamadou 1234
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            description TEXT NOT NULL,
            card_type TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT DEFAULT NULL,
            bank TEXT NOT NULL,
            full_email TEXT DEFAULT 'No email content',
            category TEXT DEFAULT 'Uncategorized',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Ensure new columns exist when upgrading from older schemas
    _check_and_update_columns(cursor)

    # ✅ Create index to speed up queries on amount and date
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_amount_date
        ON transactions(amount, date);
    """)

    # ✅ Create tags table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tag_name TEXT UNIQUE NOT NULL
        )
    """)

    # ✅ Create transaction_tags table (Many-to-Many relationship)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transaction_tags (
            transaction_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            FOREIGN KEY (transaction_id) REFERENCES transactions(id),
            FOREIGN KEY (tag_id) REFERENCES tags(id),
            PRIMARY KEY (transaction_id, tag_id)
        )
    """)

    # ✅ Create keyword_rules table for automatic categorization and tagging
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS keyword_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            keyword TEXT NOT NULL UNIQUE,
            category TEXT,
            tags TEXT
        )
    """)

    conn.commit()
    conn.close()
    print("✅ SQLite database and tables created successfully!")

# Run the function to create/update the database schema
create_database()

