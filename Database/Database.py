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
        "user_id": "TEXT DEFAULT NULL",
    }

    cursor.execute("PRAGMA table_info(transactions)")
    existing = {row[1] for row in cursor.fetchall()}

    for col, definition in required.items():
        if col not in existing:
            cursor.execute(
                f"ALTER TABLE transactions ADD COLUMN {col} {definition}"
            )
            print(f"➡️ Added missing column '{col}' to transactions table")


def _ensure_keyword_rules_user_id(cursor):
    """Migrate keyword_rules to have a user_id column and composite uniqueness."""
    cursor.execute("PRAGMA table_info(keyword_rules)")
    cols = {row[1]: row for row in cursor.fetchall()}
    if not cols:
        cursor.execute("""
            CREATE TABLE keyword_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                keyword TEXT NOT NULL,
                category TEXT,
                tags TEXT,
                UNIQUE(user_id, keyword)
            )
        """)
        return
    if "user_id" in cols and "id" in cols:
        return

    # Need to rebuild the table to drop the keyword PK and add user_id + id.
    cursor.execute("ALTER TABLE keyword_rules RENAME TO keyword_rules_old")
    cursor.execute("""
        CREATE TABLE keyword_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            keyword TEXT NOT NULL,
            category TEXT,
            tags TEXT,
            UNIQUE(user_id, keyword)
        )
    """)
    cursor.execute("""
        INSERT INTO keyword_rules (user_id, keyword, category, tags)
        SELECT NULL, keyword, category, tags FROM keyword_rules_old
    """)
    cursor.execute("DROP TABLE keyword_rules_old")
    print("➡️ Migrated keyword_rules to include user_id")


def _ensure_chat_usage_user_id(cursor):
    cursor.execute("PRAGMA table_info(chat_usage)")
    existing = {row[1] for row in cursor.fetchall()}
    if "user_id" not in existing:
        cursor.execute("ALTER TABLE chat_usage ADD COLUMN user_id TEXT DEFAULT NULL")
        print("➡️ Added user_id column to chat_usage")


def create_database():
    db_path = get_db_path()
    ensure_db_directory(db_path)

    conn = connect_db(db_path)
    cursor = conn.cursor()

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
            transaction_type TEXT DEFAULT 'expense',
            user_id TEXT DEFAULT NULL
        )
    """)

    _check_and_update_columns(cursor)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_amount_date
        ON transactions(amount, date);
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_transactions_user_id
        ON transactions(user_id);
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tag_name TEXT UNIQUE NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transaction_tags (
            transaction_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            FOREIGN KEY (transaction_id) REFERENCES transactions(id),
            FOREIGN KEY (tag_id) REFERENCES tags(id),
            PRIMARY KEY (transaction_id, tag_id)
        )
    """)

    _ensure_keyword_rules_user_id(cursor)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT DEFAULT (datetime('now')),
            model TEXT NOT NULL,
            prompt_tokens INTEGER DEFAULT 0,
            completion_tokens INTEGER DEFAULT 0,
            total_tokens INTEGER DEFAULT 0,
            user_message TEXT,
            response_length INTEGER DEFAULT 0,
            duration_ms INTEGER DEFAULT 0,
            context_queries TEXT DEFAULT NULL,
            estimated_cost REAL DEFAULT 0,
            user_id TEXT DEFAULT NULL
        )
    """)

    _ensure_chat_usage_user_id(cursor)

    conn.commit()
    conn.close()
    print(f"✅ SQLite database and tables created/migrated successfully at {db_path}!")


if __name__ == "__main__":
    create_database()
