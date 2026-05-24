import logging
import os

try:
    from db_config import connect_db
except ImportError:
    from Database.db_config import connect_db

if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _resolve_user_id(ordered_data):
    return (
        ordered_data.get("user_id")
        or os.environ.get("APP_USER_ID")
        or None
    )


def normalize_tags(tags):
    if tags is None:
        return []
    if isinstance(tags, str):
        values = tags.split(",")
    elif isinstance(tags, list):
        values = []
        for item in tags:
            if isinstance(item, str):
                values.extend(item.split(","))
    else:
        return []
    normalized = []
    seen = set()
    for tag in values:
        cleaned = tag.strip()
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            normalized.append(cleaned)
    return normalized


def apply_keyword_rules(cursor, description, category, tags, user_id):
    """Apply user's keyword rules (scoped to user_id) to determine category/tags."""
    cursor.execute(
        """
        SELECT keyword, category, tags FROM keyword_rules
        WHERE user_id IS ?
          AND ? LIKE '%' || keyword || '%' COLLATE NOCASE
        """,
        (user_id, description),
    )

    tag_set = set(tags)
    final_category = category
    matched_rules = []

    for keyword, rule_category, rule_tags in cursor.fetchall():
        rule_info = {"keyword": keyword}
        if rule_category:
            final_category = rule_category
            rule_info["category"] = rule_category
        else:
            rule_info["category"] = None
        if rule_tags:
            parsed_tags = [t.strip() for t in rule_tags.split(',') if t.strip()]
            tag_set.update(parsed_tags)
            rule_info["tags"] = parsed_tags
        else:
            rule_info["tags"] = []
        matched_rules.append(rule_info)

    return final_category, list(tag_set), matched_rules


def insert_transaction(ordered_data):
    conn = connect_db()
    cursor = conn.cursor()

    try:
        amount = float(ordered_data["amount"])
        category = ordered_data.get("category", "Uncategorized")
        card_type = ordered_data.get("card_type") or ordered_data.get("card type")
        tags = normalize_tags(ordered_data.get("tags", []))
        user_id = _resolve_user_id(ordered_data)

        category, tags, matched_rules = apply_keyword_rules(
            cursor, ordered_data["description"], category, tags, user_id
        )
        source_type = ordered_data.get("source_type", "manual")
        source_ref = ordered_data.get("source_ref")

        raw_desc = ordered_data["description"]
        raw_description = ordered_data.get("raw_description", raw_desc)
        normalized_merchant = ordered_data.get("normalized_merchant", raw_desc)
        duplicate_status = ordered_data.get("duplicate_status", "unchecked")
        duplicate_group_id = ordered_data.get("duplicate_group_id")
        transaction_type = ordered_data.get("transaction_type", "expense")

        cursor.execute("""
            INSERT INTO transactions (
                amount, description, card_type, date, time, bank, full_email, category,
                source_type, source_ref, raw_description, normalized_merchant,
                duplicate_status, duplicate_group_id, transaction_type, user_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            amount,
            raw_desc,
            card_type,
            ordered_data["date"],
            ordered_data.get("time", None),
            ordered_data["bank"],
            ordered_data.get("full_email", "No email content"),
            category,
            source_type,
            source_ref,
            raw_description,
            normalized_merchant,
            duplicate_status,
            duplicate_group_id,
            transaction_type,
            user_id,
        ))

        transaction_id = cursor.lastrowid

        for tag in tags:
            cursor.execute("INSERT OR IGNORE INTO tags (tag_name) VALUES (?)", (tag,))
            cursor.execute("SELECT id FROM tags WHERE tag_name = ?", (tag,))
            tag_id = cursor.fetchone()[0]
            cursor.execute(
                "INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)",
                (transaction_id, tag_id),
            )

        conn.commit()
        logger.info("Transaction saved: %s", ordered_data)

        return {
            "transaction_id": transaction_id,
            "category": category,
            "tags": tags,
            "applied_rules": matched_rules,
            "source_type": source_type,
            "source_ref": source_ref,
            "user_id": user_id,
        }

    except ValueError:
        logger.error("Amount '%s' is not a valid number.", ordered_data['amount'])
        return {"error": f"Invalid amount: {ordered_data['amount']}"}

    finally:
        conn.close()


if __name__ == "__main__":
    sample_transaction = {
        "amount": 74.99,
        "description": "Uber Eats",
        "card_type": "Credit Card",
        "date": "2025-02-13",
        "time": "10:40:00",
        "bank": "MBNA",
        "full_email": None,
        "category": "Food",
        "tags": ["Food", "Food Ordering"],
    }
    insert_transaction(sample_transaction)
