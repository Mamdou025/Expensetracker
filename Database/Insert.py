import sqlite3

def insert_transaction(ordered_data):
    conn = sqlite3.connect("transactions.db")
    cursor = conn.cursor()

    # Insert extracted data into the database
    cursor.execute("""
        INSERT INTO transactions (amount, description, card_type, date, time, bank, full_email)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        ordered_data["amount"],
        ordered_data["description"],
        ordered_data["card type"],
        ordered_data["date"],
        ordered_data["time"],
        ordered_data["bank"],
        ordered_data["full_email"]
    ))

    conn.commit()
    conn.close()
    print(f"✅ Transaction saved: {ordered_data}")

# Example Usage: Simulating extracted data
"""
extracted_transaction = {
    "amount": 74,
    "description": "UBER EATS",
    "card type": "Credit Card",
    "date": "2025-02-13",
    "time": "10:40:00",
    "bank": "MBNA",
    "full_email": "Achatuber eats ."
}

insert_transaction(extracted_transaction)

"""
