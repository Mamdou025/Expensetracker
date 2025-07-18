import sys
import os
import json

# Ensure Application and project root modules are importable
current_dir = os.path.dirname(__file__)
sys.path.append(os.path.abspath(os.path.join(current_dir, '..')))
sys.path.append(os.path.abspath(os.path.join(current_dir, '..', '..')))

from traitement import extract_transaction_data
from Database.Insert import insert_transaction


def main():
    raw = sys.stdin.read()
    if not raw:
        print(json.dumps({'error': 'no data'}))
        return
    try:
        emails = json.loads(raw)
    except json.JSONDecodeError:
        print(json.dumps({'error': 'invalid json'}))
        return

    results = []
    for email in emails:
        trans = extract_transaction_data(email, email.get('sender'), email.get('subject'), email.get('email_datetime'))
        insert_transaction(trans)
        results.append(trans)
    print(json.dumps(results))


if __name__ == '__main__':
    main()
