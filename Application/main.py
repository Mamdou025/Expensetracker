from extracteur import fetch_email_text
from traitement import extract_transaction_data

def main():
    """
    Orchestrates the workflow:
    1. Fetch the email body and received date/time.
    2. Extract transaction details.
    3. Display or store the extracted data.
    """
    email_text, email_datetime = fetch_email_text()

    if email_text:
        transaction_data = extract_transaction_data(email_text, email_datetime)
        print("✅ Extracted Transaction Data:")
        print(transaction_data)
    else:
        print("❌ No transaction email found.")

if __name__ == "__main__":
    main()