import sqlite3
import os

def delete_all_data():
    """Deletes all transactions, tags, and their relationships permanently."""
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "transactions.db")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # ✅ Drop the transaction_tags table (removes all transaction-tag links)
        cursor.execute("DROP TABLE IF EXISTS transaction_tags")

        # ✅ Drop the transactions table (removes all transactions)
        cursor.execute("DROP TABLE IF EXISTS transactions")

        # ✅ Drop the tags table (removes all tags)
        cursor.execute("DROP TABLE IF EXISTS tags")

        conn.commit()
        print("✅ All transactions, tags, and relationships have been deleted!")

    except sqlite3.Error as e:
        print(f"❌ Error deleting data: {e}")

    finally:
        conn.close()

if __name__ == "__main__":
    delete_all_data()
