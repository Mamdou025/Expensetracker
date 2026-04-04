import sys
import os
import json

current_dir = os.path.dirname(__file__)
sys.path.append(os.path.abspath(os.path.join(current_dir, '..')))
sys.path.append(os.path.abspath(os.path.join(current_dir, '..', '..')))

from Database.Insert import insert_transaction

try:
    from db_config import connect_db
except ImportError:
    from Database.db_config import connect_db


def check_duplicate(date, amount, bank, description):
    conn = connect_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id FROM transactions WHERE date = ? AND amount = ? AND bank = ? AND LOWER(TRIM(description)) = LOWER(TRIM(?)) LIMIT 1",
            (date, amount, bank, description),
        )
        row = cursor.fetchone()
        return row is not None
    finally:
        conn.close()


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
    skipped = 0
    skipped_list = []

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

        direction = (trans.get("direction") or "").lower().strip()
        if direction in ("deposit", "payment"):
            trans["transaction_type"] = "income"
        else:
            trans["transaction_type"] = "expense"

        if check_duplicate(
            trans.get("date", ""),
            float(trans.get("amount", 0)),
            trans.get("bank", "Unknown"),
            trans.get("description", ""),
        ):
            skipped += 1
            skipped_list.append({
                "description": trans.get("description"),
                "amount": trans.get("amount"),
                "date": trans.get("date"),
                "reason": "duplicate",
            })
            continue

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
        "skipped": skipped,
        "skipped_transactions": skipped_list,
        "transactions": results,
    }))


if __name__ == '__main__':
    main()
