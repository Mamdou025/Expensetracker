import sqlite3

def fetch_transactions():
    conn = sqlite3.connect("transactions.db")
    cursor = conn.cursor()
    
    # Fetch all transactions
    cursor.execute("SELECT * FROM transactions")
    transactions = cursor.fetchall()
    
    conn.close()

    # Print transactions in a readable format
    print("\n🔹 All Transactions 🔹")
    if not transactions:
        print("No transactions found.")
        return
    
    for tx in transactions:
        print(f"""
        ID: {tx[0]}
        Amount: ${tx[1]:.2f}
        Description: {tx[2]}
        Date: {tx[3]}
        Time: {tx[4]}
        Bank: {tx[5]}
        Card Type: {tx[6]}
        Last 4 Digits: {tx[7] if tx[7] else 'N/A'}
        ------------------------
        """)

# Call the function to display transactions
fetch_transactions()
