import sqlite3
import os

# ✅ Define the keywords and associated tags
KEYWORD_TAG_MAP = {
    "grocery": ["Food"],
    "walmart": ["Groceries", "Retail"],
    "amazon": ["Shopping", "Online"],
    "uber": ["Transport", "Ride Sharing"],
    "mcdonald": ["Food", "Fast Food"],
    "starbucks": ["Food", "Coffee"],
    "gas": ["Transport", "Fuel"],
    "netflix": ["Entertainment", "Streaming"],
    "spotify": ["Entertainment", "Music"],
    "gym": ["Health", "Fitness"],
    "pharmacy": ["Health", "Medicine"],
    "airbnb": ["Travel", "Lodging"],
    "hotel": ["Travel", "Lodging"]
}

def auto_tag_transactions():
    """Automatically adds tags to transactions based on keywords."""
    
    # ✅ Database path
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "../Database/transactions.db")

    # ✅ Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # ✅ Fetch all transactions
    cursor.execute("SELECT id, description FROM transactions")
    transactions = cursor.fetchall()

    for transaction_id, description in transactions:
        matched_tags = []

        # ✅ Lowercase description for matching
        desc_lower = description.lower()

        # ✅ Check for keyword matches
        for keyword, tags in KEYWORD_TAG_MAP.items():
            if keyword in desc_lower:
                matched_tags.extend(tags)

        # ✅ If tags are found, insert them
        if matched_tags:
            for tag in set(matched_tags):  # Remove duplicates
                # Insert tag if it doesn't exist
                cursor.execute("INSERT OR IGNORE INTO tags (tag_name) VALUES (?)", (tag,))
                
                # Get tag ID
                cursor.execute("SELECT id FROM tags WHERE tag_name = ?", (tag,))
                tag_id = cursor.fetchone()[0]

                # Link transaction to tag
                cursor.execute("""
                    INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id)
                    VALUES (?, ?)
                """, (transaction_id, tag_id))

            print(f"✅ Tagged Transaction {transaction_id} with: {', '.join(set(matched_tags))}")

    conn.commit()
    conn.close()
    print("🚀 Auto-tagging completed successfully!")

if __name__ == "__main__":
    auto_tag_transactions()
