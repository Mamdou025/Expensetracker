import sqlite3

from db_config import connect_db

def get_top_100_transactions():
    # ✅ Connect to the database
    conn = connect_db()
    cursor = conn.cursor()

    try:
        # ✅ Fetch top 100 transactions by amount
        cursor.execute("""
            SELECT id, amount 
            FROM transactions 
            ORDER BY amount DESC 
            LIMIT 100;
        """)

        top_transactions = cursor.fetchall()

        # ✅ Display transaction IDs and amounts
        print("💰 Top 100 Transactions by Amount:")
        for transaction in top_transactions:
            print(f"ID: {transaction[0]}, Amount: ${transaction[1]:.2f}")

        # ✅ Extract just the IDs if needed for further use
        transaction_ids = [transaction[0] for transaction in top_transactions]
        print("\n📋 Transaction IDs Only:")
        print(transaction_ids)

        return transaction_ids

    except sqlite3.Error as e:
        print(f"❌ Error: {e}")

    finally:
        conn.close()

if __name__ == "__main__":
    get_top_100_transactions()
