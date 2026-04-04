import sys
import os
import json

current_dir = os.path.dirname(__file__)
sys.path.append(os.path.abspath(os.path.join(current_dir, '..')))
sys.path.append(os.path.abspath(os.path.join(current_dir, '..', '..')))

from Database.Insert import insert_transaction


def main():
    raw = sys.stdin.read()
    if not raw:
        print(json.dumps({"error": "no data"}))
        return
    try:
        transactions = json.loads(raw)
    except json.JSONDecodeError:
        print(json.dumps({"error": "invalid json"}))
        return

    if not isinstance(transactions, list):
        print(json.dumps({"error": "expected a list of transactions"}))
        return

    results = []
    inserted = 0
    errors = 0

    for trans in transactions:
        if not isinstance(trans, dict):
            continue
        if not trans.get("amount") or not trans.get("description"):
            errors += 1
            continue
        if not trans.get("date"):
            errors += 1
            continue
        if not trans.get("bank"):
            trans["bank"] = "Unknown"

        trans.setdefault("source_type", "pdf")
        trans.setdefault("duplicate_status", "unchecked")
        trans.setdefault("tags", [])
        trans.setdefault("raw_description", trans.get("description"))
        trans.setdefault("normalized_merchant", trans.get("description"))

        insert_result = insert_transaction(trans)
        if isinstance(insert_result, dict) and "error" not in insert_result:
            inserted += 1
            results.append({
                "transaction_id": insert_result.get("transaction_id"),
                "description": trans.get("description"),
                "amount": trans.get("amount"),
                "date": trans.get("date"),
                "category": insert_result.get("category"),
                "tags": insert_result.get("tags", []),
                "source_type": insert_result.get("source_type"),
                "source_ref": insert_result.get("source_ref"),
            })
        else:
            errors += 1

    print(json.dumps({
        "inserted": inserted,
        "errors": errors,
        "transactions": results,
    }))


if __name__ == '__main__':
    main()
