import sqlite3
import os
import json

def insert_transactions_from_json(json_file):
    # ✅ Get the database path
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "../Database/transactions.db")

    # ✅ Open the database connection
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # ✅ Load JSON file
    with open(json_file, "r", encoding="utf-8") as file:
        data = json.load(file)

    for month, transactions in data.items():
        print(f"📅 Processing {month}: {len(transactions)} transactions")

        for transaction in transactions:
            amount = float(transaction["amount"])
            description = transaction["description"]
            card_type = transaction["card_type"]
            date = transaction["date"]
            time = transaction["time"] if transaction["time"] else None
            bank = transaction["bank"]
            full_email = transaction["full_email"] if transaction["full_email"] else "No email content"
            category = transaction["category"] if transaction["category"] else "Uncategorized"
            tags = transaction.get("tags", [])  # ✅ Extract tags if available

            # ✅ Insert transaction into the transactions table
            cursor.execute("""
                INSERT INTO transactions (amount, description, card_type, date, time, bank, full_email, category)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (amount, description, card_type, date, time, bank, full_email, category))

            transaction_id = cursor.lastrowid  # ✅ Get the inserted transaction ID

            # ✅ Insert tags and create relationships
            for tag in tags:
                # Insert tag if it does not exist
                cursor.execute("INSERT OR IGNORE INTO tags (tag_name) VALUES (?)", (tag,))
                
                # Retrieve tag ID
                cursor.execute("SELECT id FROM tags WHERE tag_name = ?", (tag,))
                tag_id = cursor.fetchone()[0]

                # Link transaction to tag
                cursor.execute("INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)", (transaction_id, tag_id))

    conn.commit()
    conn.close()
    print("✅ All transactions and tags imported successfully!")

# Run the script
if __name__ == "__main__":
    insert_transactions_from_json("mbna.json")
