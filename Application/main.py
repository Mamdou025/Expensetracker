import sys
import os
import json

# ✅ Add the root folder to Python’s module search path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from Database.Insert import insert_transaction  # ✅ Now it should work!
from extracteur import fetch_email_text
from traitement import extract_transaction_data

def main():
    """
    Orchestrates the workflow:
    1. Fetch the email body and received date/time.
    2. Extract transaction details.
    3. Store the extracted data in the database.
    """
    email_text, email_datetime, subject, sender = fetch_email_text()

    if email_text:
        ordered_data = extract_transaction_data(email_text, sender, subject, email_datetime)
        print("✅ Extracted Data:")
        print(json.dumps(ordered_data, indent=4))

        # ✅ Insert extracted data into SQLite
        insert_transaction(ordered_data)
        print("✅ Transaction successfully inserted into the database.")

    else:
        print("❌ No transaction email found.")

if __name__ == "__main__":
    main()
