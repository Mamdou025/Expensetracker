import sqlite3
import os

# ✅ Define path to your database
base_dir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(base_dir, "transactions.db")

# ✅ Connect to the database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # ✅ Step 1: Rename the existing table
    cursor.execute("ALTER TABLE transactions RENAME TO transactions_old;")

    # ✅ Step 2: Create a new transactions table (without `tags`)
    cursor.execute("""
        CREATE TABLE transactions (
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

    # ✅ Step 3: Copy data from the old table
    cursor.execute("""
        INSERT INTO transactions (id, amount, description, card_type, date, time, bank, full_email, category, created_at)
        SELECT id, amount, description, card_type, date, time, bank, full_email, category, created_at
        FROM transactions_old;
    """)

    # ✅ Step 4: Drop the old table
    cursor.execute("DROP TABLE transactions_old;")

    conn.commit()
    print("✅ Migration completed: 'tags' column removed from transactions table.")

except Exception as e:
    print("❌ Migration failed:", e)

finally:
    conn.close()
