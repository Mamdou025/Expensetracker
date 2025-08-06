import os
import sys
import json

# Ensure the Database module is importable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from Database.Insert import insert_transaction


def insert_transactions_from_json(json_file):
    """Load transactions from a JSON file and insert them using shared logic."""
    with open(json_file, "r", encoding="utf-8") as file:
        data = json.load(file)

    for month, transactions in data.items():
        print(f"📅 Processing {month}: {len(transactions)} transactions")
        for transaction in transactions:
            insert_transaction(transaction)

    print("✅ All transactions and tags imported successfully!")


if __name__ == "__main__":
    insert_transactions_from_json("juildec.json")
