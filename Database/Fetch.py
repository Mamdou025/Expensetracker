import sqlite3
import os

def fetch_all_transactions():
    """
    Fetches all transactions stored in the SQLite database.
    """
    #conn = sqlite3.connect("transactions.db")  # Connect to the database
    #cursor = conn.cursor()
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "transactions.db")

    conn = sqlite3.connect(db_path)  # Always creates/opens 'transactions.db' in the correct location
    cursor = conn.cursor()
    # ✅ Select all transactions
    cursor.execute("SELECT * FROM transactions")
    transactions = cursor.fetchall()

    conn.close()  # Close the connection

    print("\n🔹 Stored Transactions 🔹")
    if not transactions:
        print("No transactions found.")
        return

    # ✅ Print transactions in a readable format
    for tx in transactions:
        print(f"""
        ID: {tx[0]}
        Amount: ${tx[1]:.2f}
        Description: {tx[2]}
        Card Type: {tx[3]}
        Date: {tx[4]}
        Time: {tx[5]}
        Bank: {tx[6]}
        ------------------------
        """)

if __name__ == "__main__":
    fetch_all_transactions()
