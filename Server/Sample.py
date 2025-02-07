
import sqlite3


def insert_transaction(amount, description, date, time, bank_name, card_type, last_four_digits, full_email):
    conn = sqlite3.connect("transactions.db")
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO transactions (amount, description, date, time, bank_name, card_type, last_four_digits, full_email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (amount, description, date, time, bank_name, card_type, last_four_digits, full_email))
    
    conn.commit()
    conn.close()
    
    print("✅ Transaction saved to SQLite.")

# Example Usage:
insert_transaction(12.99, "Maxi ", "2024-04-16", "18:23:00", "MBNA", "Credit Card", "4532", "FuBonjour dede e...")
