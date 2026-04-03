import sqlite3

from db_config import connect_db

def delete_all_data():
    """Deletes all transactions, tags, and their relationships permanently."""
    conn = connect_db()
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
