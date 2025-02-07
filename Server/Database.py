import sqlite3

# Connect to SQLite (Creates 'transactions.db' if it doesn't exist)
conn = sqlite3.connect("transactions.db")
cursor = conn.cursor()

# Create the transactions table
cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        bank_name TEXT NOT NULL,
        card_type TEXT NOT NULL,
        last_four_digits TEXT,
        full_email TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
conn.commit()
conn.close()

print("✅ SQLite database and 'transactions' table created successfully!")
