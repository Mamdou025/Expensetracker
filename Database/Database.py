import sqlite3

def create_database():
    # Connect to SQLite (creates 'transactions.db' if it doesn't exist)
    conn = sqlite3.connect("transactions.db")
    cursor = conn.cursor()

    # Create the transactions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            description TEXT NOT NULL,
            card_type TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            bank TEXT NOT NULL,
            full_email TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()
    print("✅ SQLite database and 'transactions' table created successfully!")

# Run the function to create the database
create_database()

