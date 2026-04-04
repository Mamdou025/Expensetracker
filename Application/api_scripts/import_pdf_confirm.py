import sys
import os
import json
import re
from datetime import datetime, timedelta

current_dir = os.path.dirname(__file__)
sys.path.append(os.path.abspath(os.path.join(current_dir, '..')))
sys.path.append(os.path.abspath(os.path.join(current_dir, '..', '..')))

from Database.Insert import insert_transaction

try:
    from db_config import connect_db
except ImportError:
    from Database.db_config import connect_db


def norm_desc(desc):
    if not desc:
        return ''
    d = desc.lower().strip()
    d = re.sub(r'^retail purchase\s+\d+\s+', '', d, flags=re.IGNORECASE)
    d = re.sub(r'^e-transfer\s+\d+\s*', 'e-transfer ', d, flags=re.IGNORECASE)
    d = re.sub(r'\s+', ' ', d)
    return d


def check_duplicate(date, amount, bank, description):
    conn = connect_db()
    cursor = conn.cursor()
    try:
        dt = datetime.strptime(date, '%Y-%m-%d')
        date_start = (dt - timedelta(days=2)).strftime('%Y-%m-%d')
        date_end = (dt + timedelta(days=2)).strftime('%Y-%m-%d')

        cursor.execute(
            "SELECT date, amount, description FROM transactions WHERE amount = ? AND bank = ? AND date BETWEEN ? AND ?",
            (float(amount), bank, date_start, date_end),
        )
        rows = cursor.fetchall()
        if not rows:
            return False

        new_norm = norm_desc(description)
        for row in rows:
            ex_norm = norm_desc(row[2])
            if ex_norm == new_norm:
                return True
            if ex_norm in new_norm or new_norm in ex_norm:
                return True
        return False
    except Exception:
        return False
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
