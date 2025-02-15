import sqlite3
import os

def create_database():
    # ✅ Get the absolute path of the 'Database' folder
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "transactions.db")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # ✅ Create transactions table
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

    conn.commit()
    conn.close()
    print("✅ SQLite database and tables created successfully!")

# Run the function to create/update the database schema
create_database()

