import sqlite3

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

    # ✅ Connect to the database
    conn = sqlite3.connect("transactions.db")
    cursor = conn.cursor()

    # ✅ Insert the data
    cursor.execute("""
        INSERT INTO transactions (amount, description, card_type, date, time, bank, full_email)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (amount, description, card_type, date, time, bank, full_email))

    conn.commit()
    conn.close()

    print("\n✅ Transaction successfully added to the database!")

if __name__ == "__main__":
    manual_insert()
