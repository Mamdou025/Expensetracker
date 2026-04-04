import sys
import os
import json

# Ensure Application and project root modules are importable
current_dir = os.path.dirname(__file__)
sys.path.append(os.path.abspath(os.path.join(current_dir, '..')))
sys.path.append(os.path.abspath(os.path.join(current_dir, '..', '..')))

from traitement import extract_transaction_data
from Database.Insert import insert_transaction

def _source_ref_from_email(email_payload):
    if not isinstance(email_payload, dict):
        return None
    parts = [email_payload.get("sender"), email_payload.get("subject"), email_payload.get("email_datetime")]
    cleaned = [str(p).strip() for p in parts if p]
    return "|".join(cleaned) if cleaned else None

def _normalize_queue_item(item):
    """Return a normalized transaction candidate from a queue item."""
    if not isinstance(item, dict):
        return None

    parsed_transaction = item.get("transaction")
    email_payload = item.get("email") if isinstance(item.get("email"), dict) else item

    # Reuse preview parsing when available to reduce parser drift.
    if isinstance(parsed_transaction, dict) and parsed_transaction.get("amount") is not None:
        trans = dict(parsed_transaction)
        trans.setdefault("source_type", "email")
        trans.setdefault("source_ref", email_payload.get("id") or _source_ref_from_email(email_payload))
        trans.setdefault("full_email", email_payload.get("full_email_html") or email_payload.get("email"))
        trans.setdefault("tags", [])
        trans.setdefault("raw_description", trans.get("description"))
        trans.setdefault("normalized_merchant", trans.get("description"))
        trans.setdefault("duplicate_status", "suspected" if trans.get("duplicate") else "unchecked")
        return trans

    # Fallback for legacy callers that only submit the raw email payload.
    trans = extract_transaction_data(
        email_payload,
        email_payload.get("sender"),
        email_payload.get("subject"),
        email_payload.get("email_datetime"),
    )
    trans.setdefault("source_type", "email")
    trans.setdefault("source_ref", email_payload.get("id") or _source_ref_from_email(email_payload))
    trans.setdefault("tags", [])
    return trans

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
        trans = _normalize_queue_item(email)
        if not trans:
            continue
        insert_result = insert_transaction(trans)
        if isinstance(insert_result, dict):
            trans['category'] = insert_result.get('category', trans.get('category'))
            trans['tags'] = insert_result.get('tags', trans.get('tags', []))
            trans['applied_rules'] = insert_result.get('applied_rules', [])
            trans['source_type'] = insert_result.get('source_type', trans.get('source_type'))
            trans['source_ref'] = insert_result.get('source_ref', trans.get('source_ref'))
        results.append(trans)
    print(json.dumps(results))


if __name__ == '__main__':
    main()
