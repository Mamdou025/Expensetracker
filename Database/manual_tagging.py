import sqlite3
import os

def get_all_transactions():
    """Fetch all transactions for selection."""
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "transactions.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT t.id, t.amount, t.description, t.date, t.time, COALESCE(GROUP_CONCAT(g.tag_name, ', '), '') AS tags
        FROM transactions t
        LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
        LEFT JOIN tags g ON tt.tag_id = g.id
        GROUP BY t.id
        ORDER BY t.date DESC;
    """)
    transactions = cursor.fetchall()
    conn.close()

    return transactions

def get_all_tags():
    """Fetch all available tags for selection."""
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "transactions.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT id, tag_name FROM tags ORDER BY tag_name;")
    tags = cursor.fetchall()
    conn.close()

    return tags

def assign_tag_to_transactions(tag_id, transaction_ids):
    """Assigns a tag to multiple transactions."""
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "transactions.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    for transaction_id in transaction_ids:
        try:
            cursor.execute("""
                INSERT INTO transaction_tags (transaction_id, tag_id) 
                VALUES (?, ?)
            """, (transaction_id, tag_id))
        except sqlite3.IntegrityError:
            print(f"⚠️ Transaction {transaction_id} already has this tag.")

    conn.commit()
    conn.close()
    print("✅ Tags successfully assigned!")

def main():
    print("\n🔹 **Manual Tagging System** 🔹")

    # Show existing tags
    tags = get_all_tags()
    print("\n📌 Existing Tags:")
    for tag in tags:
        print(f"{tag[0]} - {tag[1]}")

    # Ask the user for a new tag or existing tag ID
    tag_name = input("\nEnter a new tag name (or existing tag ID): ").strip()

    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "transactions.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    if tag_name.isdigit():  # If the user entered an existing tag ID
        tag_id = int(tag_name)
    else:
        cursor.execute("INSERT OR IGNORE INTO tags (tag_name) VALUES (?)", (tag_name,))
        conn.commit()
        tag_id = cursor.lastrowid  # Get the newly created tag's ID
        print(f"✅ Created new tag: {tag_name} (ID: {tag_id})")

    conn.close()

    # Show transactions to choose from
    transactions = get_all_transactions()
    print("\n📌 Transactions:")
    for tx in transactions:
        print(f"{tx[0]} - {tx[1]:.2f} {tx[2]} ({tx[3]}) [Tags: {tx[5]}]")

    transaction_ids = input("\nEnter transaction IDs to tag (comma-separated): ").strip()
    transaction_ids = [int(id.strip()) for id in transaction_ids.split(",")]

    assign_tag_to_transactions(tag_id, transaction_ids)

if __name__ == "__main__":
    main()
