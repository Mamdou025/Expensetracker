import sqlite3
import os

def insert_transaction(ordered_data):
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "transactions.db")

    conn = sqlite3.connect(db_path)  # Always creates/opens 'transactions.db' in the correct location
    cursor = conn.cursor()

    # Insert extracted data into the database
    cursor.execute("""
        INSERT INTO transactions (amount, description, card_type, date, time, bank, full_email)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        ordered_data["amount"],
        ordered_data["description"],
        ordered_data["card type"],
        ordered_data["date"],
        ordered_data["time"],
        ordered_data["bank"],
        ordered_data["full_email"]
    ))

    conn.commit()
    conn.close()
    print(f"✅ Transaction saved: {ordered_data}")


