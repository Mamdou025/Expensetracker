import sqlite3
import os

def create_database():
    # Connect to SQLite (creates 'transactions.db' if it doesn't exist)
    #conn = sqlite3.connect("transactions.db")
    #test code 
    

    # Get the absolute path of the 'Database' folder
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "transactions.db")

    conn = sqlite3.connect(db_path)  # Always creates/opens 'transactions.db' in the correct location
    cursor = conn.cursor()

    #test code 
    #cursor = conn.cursor()

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

