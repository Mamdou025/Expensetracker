import sqlite3
import os

def manual_insert():
    """
    Allows the user to manually enter a transaction into the SQLite database.
    """
    # ✅ Ask for user input
    amount = input("Enter transaction amount: ")
    description = input("Enter transaction description: ")
    card_type = input("Enter card type (Credit Card / Debit Card): ")
    date = input("Enter transaction date (YYYY-MM-DD): ")
    time = input("Enter transaction time (HH:MM:SS): ")
    bank = input("Enter bank name: ")
    full_email = input("Enter additional notes (or leave empty): ")
    category = input("Enter transaction category (or leave empty for 'Uncategorized'): ") or "Uncategorized"

    # ✅ Ensure correct database path
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "transactions.db")

    conn = sqlite3.connect(db_path)  # Always creates/opens 'transactions.db' in the correct location
    cursor = conn.cursor()

    try:
        # ✅ Convert amount to float
        amount = float(amount)

        # ✅ Check if a transaction with the same details already exists
        cursor.execute("""
            SELECT COUNT(*) FROM transactions 
            WHERE amount = ? AND date = ? AND time = ? AND bank = ?
        """, (amount, date, time, bank))
        
        duplicate_count = cursor.fetchone()[0]

        if duplicate_count > 0:
            print(f"⚠️ Duplicate transaction detected, skipping: {description} - {amount} ({date})")
            return  # Stop execution if a duplicate exists

        # ✅ Insert the new transaction
        cursor.execute("""
            INSERT INTO transactions (amount, description, card_type, date, time, bank, full_email, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (amount, description, card_type, date, time, bank, full_email, category))

        conn.commit()
        print("\n✅ Transaction successfully added to the database!")

    except ValueError:
        print("❌ Error: Invalid amount entered. Please enter a numeric value.")

    finally:
        conn.close()

if __name__ == "__main__":
    manual_insert()

