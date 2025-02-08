import json
from extracteur import fetch_email_text
from traitement import extract_transaction_data

def main():
    """
    Orchestrates the workflow:
    1. Fetch the email body and received date/time.
    2. Extract transaction details.
    3. Display or store the extracted data.
    """
    email_text, email_datetime, subject, sender= fetch_email_text()

    if email_text:
        ordered_data = extract_transaction_data(email_text, sender, email_datetime)  # ✅ Includes sender
        print("✅ Email text :")
        print(json.dumps(ordered_data, indent=4))
    else:
        print("❌ No transaction email found.")

if __name__ == "__main__":
    main()