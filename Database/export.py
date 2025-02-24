import sqlite3
import json
import os

def export_database_to_json():
    # ✅ Get the path to the database
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "../Database/transactions.db")  # Adjust path if needed

    # ✅ Connect to the SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # ✅ Fetch all transactions from the database
        cursor.execute("SELECT * FROM transactions")
        rows = cursor.fetchall()

        # ✅ Get column names
        column_names = [description[0] for description in cursor.description]

        # ✅ Convert data to list of dictionaries
        transactions = [dict(zip(column_names, row)) for row in rows]

        # ✅ Export to JSON file
        json_file_path = os.path.join(base_dir, "transactions_export.json")
        with open(json_file_path, 'w', encoding='utf-8') as json_file:
            json.dump(transactions, json_file, ensure_ascii=False, indent=4)

        print(f"✅ Database exported successfully to {json_file_path}")

    except sqlite3.Error as e:
        print(f"❌ Error: {e}")

    finally:
        conn.close()

if __name__ == "__main__":
    export_database_to_json()
