import sys
import os
import json

# Ensure modules in the parent directory (Application) are importable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from extracteur import fetch_emails
from traitement import extract_transaction_data


def main():
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'start_date and end_date required'}))
        return
    start_date = sys.argv[1]
    end_date = sys.argv[2]

    emails = fetch_emails(start_date, end_date)
    results = []
    for email in emails:
        trans = extract_transaction_data(email, email.get('sender'), email.get('subject'), email.get('email_datetime'))
        results.append({'email': email, 'transaction': trans})
    print(json.dumps(results))


if __name__ == '__main__':
    main()
