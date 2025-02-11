import sqlite3
import os

def insert_transaction(ordered_data):
    # ✅ Ensure the correct database path
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "transactions.db")

    conn = sqlite3.connect(db_path)  # Always creates/opens 'transactions.db' in the correct location
    cursor = conn.cursor()

    try:
        # ✅ Convert amount to float before inserting
        amount = float(ordered_data["amount"])

        # ✅ Assign a category (if not provided, default to 'Uncategorized')
        category = ordered_data.get("category", "Uncategorized")

        # ✅ Check if a transaction with the same details already exists
        cursor.execute("""
            SELECT COUNT(*) FROM transactions 
            WHERE amount = ? AND date = ? AND time = ? AND bank = ?
        """, (amount, ordered_data["date"], ordered_data["time"], ordered_data["bank"]))
        
        duplicate_count = cursor.fetchone()[0]

        if duplicate_count > 0:
            print(f"⚠️ Duplicate transaction detected, skipping: {ordered_data}")
            return  # Stop execution if a duplicate exists

        # ✅ Insert the transaction if it's unique
        cursor.execute("""
            INSERT INTO transactions (amount, description, card_type, date, time, bank, full_email, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            amount,
            ordered_data["description"],
            ordered_data["card type"],
            ordered_data["date"],
            ordered_data["time"],
            ordered_data["bank"],
            ordered_data["full_email"],
            category  # ✅ New field for category
        ))

        conn.commit()
        print(f"✅ Transaction saved: {ordered_data}")

    except ValueError:
        print(f"❌ Error: Amount '{ordered_data['amount']}' is not a valid number.")

    finally:
        conn.close()

