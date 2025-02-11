import sqlite3
import os

def add_category_column():
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "transactions.db")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # ✅ Add 'category' column if it does not exist
        cursor.execute("ALTER TABLE transactions ADD COLUMN category TEXT DEFAULT 'Uncategorized';")
        conn.commit()
        print("✅ 'category' column added successfully!")

    except sqlite3.OperationalError:
        print("⚠️ Column 'category' already exists.")

    finally:
        conn.close()

if __name__ == "__main__":
    add_category_column()
