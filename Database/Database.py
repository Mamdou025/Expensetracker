try:
    from db_config import connect_db, ensure_db_directory, get_db_path
except ImportError:
    from Database.db_config import connect_db, ensure_db_directory, get_db_path

def _check_and_update_columns(cursor):
    """Ensure the transactions table has all required columns."""
    required = {
        "time": "TEXT DEFAULT NULL",
        "bank": "TEXT NOT NULL",
        "full_email": "TEXT DEFAULT 'No email content'",
        "category": "TEXT DEFAULT 'Uncategorized'",
        "source_type": "TEXT DEFAULT 'manual'",
        "source_ref": "TEXT DEFAULT NULL",
        "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "raw_description": "TEXT DEFAULT NULL",
        "normalized_merchant": "TEXT DEFAULT NULL",
        "duplicate_status": "TEXT DEFAULT 'unchecked'",
        "duplicate_group_id": "TEXT DEFAULT NULL",
        "transaction_type": "TEXT DEFAULT 'expense'",
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
    db_path = get_db_path()
    ensure_db_directory(db_path)

    conn = connect_db(db_path)
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
            source_type TEXT DEFAULT 'manual',
            source_ref TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            raw_description TEXT DEFAULT NULL,
            normalized_merchant TEXT DEFAULT NULL,
            duplicate_status TEXT DEFAULT 'unchecked',
            duplicate_group_id TEXT DEFAULT NULL,
            transaction_type TEXT DEFAULT 'expense'
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
            keyword TEXT PRIMARY KEY,
            category TEXT,
            tags TEXT
        )
    """)

    conn.commit()
    conn.close()
    print(f"✅ SQLite database and tables created successfully at {db_path}!")

if __name__ == "__main__":
    create_database()
