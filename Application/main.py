import sys
import os
import json

# ✅ Add the root folder to Python’s module search path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from Database.Insert import insert_transaction  # ✅ Now it should work!
from datetime import datetime
from extracteur import fetch_emails
from traitement import extract_transaction_data

def main():
    """
    Orchestrates the workflow:
    1. Fetch the email body and received date/time.
    2. Extract transaction details.
    3. Store the extracted data in the database.
    """
    start_date = sys.argv[1] if len(sys.argv) > 1 else None
    end_date = sys.argv[2] if len(sys.argv) > 2 else None

    if start_date is None:
        start_date = "01-Jan-1970"
    if end_date is None:
        end_date = datetime.utcnow().strftime("%d-%b-%Y")

    emails = fetch_emails(start_date, end_date)

    if not emails:
        print("❌ No transaction email found.")
        return

    if len(emails) == 1:
        email = emails[0]
        ordered_data = extract_transaction_data(
            email,
            email.get("sender"),
            email.get("subject"),
            email.get("email_datetime"),
        )
        print("✅ Extracted Data:")
        print(json.dumps(ordered_data, indent=4))
        insert_transaction(ordered_data)
        print("✅ Transaction successfully inserted into the database.")
    else:
        print(f"📧 Processing {len(emails)} emails...")
        for email in emails:
            ordered_data = extract_transaction_data(
                email,
                email.get("sender"),
                email.get("subject"),
                email.get("email_datetime"),
            )
            print(json.dumps(ordered_data, indent=4))
            insert_transaction(ordered_data)
        print("✅ All transactions successfully inserted into the database.")

if __name__ == "__main__":
    main()
