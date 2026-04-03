from db_config import connect_db, get_db_path

def fetch_transactions(category=None):
    """
    Fetches transactions stored in the SQLite database.
    If a category is provided, it fetches only transactions for that category.
    """
    db_path = get_db_path()

    # ✅ Connect to the database
    conn = connect_db(db_path)
    cursor = conn.cursor()

    # ✅ Select transactions, filtered by category if provided
    if category:
        cursor.execute("SELECT * FROM transactions WHERE category = ?", (category,))
    else:
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
        Category: {tx[8]}
        ------------------------
        """)

if __name__ == "__main__":
    category_filter = input("Enter category to filter by (leave empty for all transactions): ")
    fetch_transactions(category_filter if category_filter else None)
