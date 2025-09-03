import sqlite3
import os
import logging

# Configure logging if not already done
if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache for active keyword rules
ACTIVE_RULES = None


def get_active_rules(cursor):
    """Fetch active keyword rules once and cache them."""
    global ACTIVE_RULES
    if ACTIVE_RULES is None:
        cursor.execute(
            "SELECT keyword, target_type, target_value FROM keyword_rules WHERE active = 1"
        )
        rows = cursor.fetchall()
        ACTIVE_RULES = [
            {"keyword": r[0], "target_type": r[1], "target_value": r[2]} for r in rows
        ]
    return ACTIVE_RULES

def insert_transaction(ordered_data):
    """
    Inserts a transaction into the database and associates it with relevant tags.
    """
    # ✅ Ensure correct database path
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "transactions.db")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # ✅ Convert amount to float before inserting
        amount = float(ordered_data["amount"])

        # ✅ Assign a category (if not provided, default to 'Uncategorized')
        category = ordered_data.get("category", "Uncategorized")
        tags = ordered_data.get("tags", [])  # Retrieve tags if present

        # ✅ Apply keyword rules before inserting
        description_lower = ordered_data["description"].lower()
        for rule in get_active_rules(cursor):
            if rule["keyword"].lower() in description_lower:
                if rule["target_type"] == "category":
                    category = rule["target_value"]
                elif rule["target_type"] == "tag":
                    tags.append(rule["target_value"])

        # Remove duplicate tags while preserving order
        tags = list(dict.fromkeys(tags))

        # ✅ Get or create transaction entry
        cursor.execute(
            """
            INSERT INTO transactions (amount, description, card_type, date, time, bank, full_email, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                amount,
                ordered_data["description"],
                ordered_data["card type"],
                ordered_data["date"],
                ordered_data.get("time", None),  # ✅ Allow NULL time
                ordered_data["bank"],
                ordered_data.get("full_email", "No email content"),
                category,
            ),
        )

        # ✅ Get the inserted transaction ID
        transaction_id = cursor.lastrowid

        # ✅ Insert tags and associate them with the transaction
        for tag in tags:
            cursor.execute(
                "INSERT OR IGNORE INTO tags (tag_name) VALUES (?)", (tag,)
            )  # Ensure tag exists

            # Retrieve tag ID
            cursor.execute("SELECT id FROM tags WHERE tag_name = ?", (tag,))
            tag_id = cursor.fetchone()[0]

            # Link transaction to tag
            cursor.execute(
                "INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)",
                (transaction_id, tag_id),
            )

        conn.commit()
        logger.info("Transaction saved: %s", ordered_data)

    except ValueError:
        logger.error("Amount '%s' is not a valid number.", ordered_data['amount'])

    finally:
        conn.close()

# ✅ Example usage:
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
        "tags": ["Food", "Food Ordering"]
    }

    insert_transaction(sample_transaction)
