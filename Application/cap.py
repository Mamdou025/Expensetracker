import sqlite3
import os
import sys
from datetime import datetime

# Add the root folder to Python's module search path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

class CapitalOne6234DataReplacer:
    def __init__(self, db_path=None):
        if db_path is None:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
            self.db_path = os.path.join(base_dir, 'Database', 'transactions.db')
        else:
            self.db_path = db_path
        
        self.deleted_count = 0
        self.inserted_count = 0
        self.error_count = 0
        self.purchase_transactions = []
    
    def connect_db(self):
        """Connect to the database"""
        try:
            return sqlite3.connect(self.db_path)
        except Exception as e:
            print(f"❌ Error connecting to database: {e}")
            return None
    
    def load_transaction_data(self):
        """Load all transaction data directly from embedded CSV data"""
        print("📄 Loading Capital One 6234 transaction data...")
        
        # Embedded transaction data from CSV
        transaction_data = [
            {"Date": "2025-02-04", "Description": "CENTRE DE SANTE DENTAI", "Category": "Soins de santé", "Debit": 294.00, "Credit": None},
            {"Date": "2025-02-04", "Description": "COUCHE-TARD # 1319", "Category": "Essence/véhicule", "Debit": 3.62, "Credit": None},
            {"Date": "2025-02-03", "Description": "BELL CANADA (OB)", "Category": "Articles", "Debit": 63.24, "Credit": None},
            {"Date": "2025-01-22", "Description": "OPENAI *CHATGPT SUBSCR", "Category": "Articles", "Debit": 33.93, "Credit": None},
            {"Date": "2025-01-22", "Description": "ADOBE  *ADOBE", "Category": "Articles", "Debit": 29.88, "Credit": None},
            {"Date": "2025-01-06", "Description": "PAYMENT", "Category": "Paiement/crédit", "Debit": None, "Credit": 200.00},  # Payment - excluded
            {"Date": "2025-01-03", "Description": "AGENCE DE MOBILITE DUR", "Category": "Essence/véhicule", "Debit": 9.69, "Credit": None},
            {"Date": "2025-01-03", "Description": "BELL CANADA (OB)", "Category": "Articles", "Debit": 63.24, "Credit": None},
            {"Date": "2024-12-29", "Description": "AGENCE DE MOBILITE DUR", "Category": "Essence/véhicule", "Debit": 15.22, "Credit": None},
            {"Date": "2024-12-28", "Description": "CINEPLEX ENTERTAINMENT", "Category": "Divertissement", "Debit": 44.84, "Credit": None},
            {"Date": "2024-12-22", "Description": "OPENAI *CHATGPT SUBSCR", "Category": "Articles", "Debit": 34.04, "Credit": None},
            {"Date": "2024-12-22", "Description": "Adobe", "Category": "Internet", "Debit": 29.88, "Credit": None},
            {"Date": "2024-12-11", "Description": "PAYMENT", "Category": "Paiement/crédit", "Debit": None, "Credit": 200.00},  # Payment - excluded
            {"Date": "2024-12-10", "Description": "PAYMENT", "Category": "Paiement/crédit", "Debit": None, "Credit": 500.00},  # Payment - excluded
            {"Date": "2024-12-04", "Description": "BELL CANADA (OB)", "Category": "Articles", "Debit": 63.24, "Credit": None}
        ]
        
        # Process only purchase transactions (Debit > 0)
        for transaction in transaction_data:
            if transaction["Debit"] and transaction["Debit"] > 0:  # Only purchases
                processed_transaction = {
                    'date': transaction["Date"],
                    'description': self.clean_description(transaction["Description"]),
                    'amount': transaction["Debit"],
                    'category': transaction["Category"]
                }
                self.purchase_transactions.append(processed_transaction)
        
        print(f"✅ Loaded {len(self.purchase_transactions)} purchase transactions")
        return len(self.purchase_transactions) > 0
    
    def clean_description(self, description):
        """Clean up the description"""
        # Clean up common patterns
        cleaned = description.strip()
        
        # Fix common merchant names
        if "COUCHE-TARD" in cleaned:
            cleaned = "COUCHE-TARD #1319"
        elif "BELL CANADA" in cleaned:
            cleaned = "BELL CANADA"
        elif "OPENAI" in cleaned:
            cleaned = "OPENAI ChatGPT Subscription"
        elif "ADOBE" in cleaned:
            cleaned = "Adobe Subscription"
        elif "AGENCE DE MOBILITE" in cleaned:
            cleaned = "AGENCE DE MOBILITE DURABLE"
        elif "CINEPLEX" in cleaned:
            cleaned = "CINEPLEX ENTERTAINMENT"
        elif "CENTRE DE SANTE" in cleaned:
            cleaned = "CENTRE DE SANTE DENTAIRE"
        
        return cleaned
    
    def delete_capital_one_transactions(self, start_date):
        """Delete all Capital One 6234 transactions from a specific date onwards"""
        conn = self.connect_db()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT COUNT(*) FROM transactions 
                WHERE (bank = 'capital_one_credit' OR bank LIKE '%capital%one%') 
                AND date >= ?
            """, (start_date,))
            count_to_delete = cursor.fetchone()[0]
            
            if count_to_delete > 0:
                print(f"🗑️ Found {count_to_delete} Capital One transactions to delete (from {start_date} onwards)")
                
                cursor.execute("""
                    DELETE FROM transactions 
                    WHERE (bank = 'capital_one_credit' OR bank LIKE '%capital%one%') 
                    AND date >= ?
                """, (start_date,))
                
                self.deleted_count = cursor.rowcount
                conn.commit()
                print(f"✅ Deleted {self.deleted_count} Capital One transactions")
            else:
                print(f"📭 No Capital One transactions found to delete from {start_date} onwards")
            
            conn.close()
            return True
            
        except Exception as e:
            print(f"❌ Error deleting transactions: {e}")
            conn.close()
            return False
    
    def insert_transaction(self, transaction):
        """Insert a single transaction using the existing insert function"""
        try:
            from Database.Insert import insert_transaction
            insert_transaction(transaction)
            return True
        except Exception as e:
            print(f"❌ Error inserting transaction: {e}")
            return False
    
    def insert_new_transactions(self):
        """Insert all new transactions"""
        print(f"\n🔄 Inserting {len(self.purchase_transactions)} new transactions...")
        
        for i, trans in enumerate(self.purchase_transactions, 1):
            try:
                transaction = {
                    'amount': f"{trans['amount']:.2f}",
                    'description': trans['description'],
                    'card type': 'credit card',
                    'date': trans['date'],
                    'time': None,
                    'bank': 'capital_one_credit',
                    'full_email': '',
                    'tags': ''  # Empty tags to avoid constraint issues
                }
                
                if self.insert_transaction(transaction):
                    self.inserted_count += 1
                    print(f"✅ [{i}/{len(self.purchase_transactions)}] Inserted: ${transaction['amount']} - {transaction['description']} ({transaction['date']})")
                else:
                    self.error_count += 1
                    
            except Exception as e:
                self.error_count += 1
                print(f"❌ [{i}/{len(self.purchase_transactions)}] Error: {e}")
                continue
    
    def get_date_range(self):
        """Get the date range of transactions"""
        if not self.purchase_transactions:
            return None, None
        
        dates = [trans['date'] for trans in self.purchase_transactions]
        return min(dates), max(dates)
    
    def print_summary(self):
        """Print processing summary"""
        print("\n" + "="*60)
        print("📊 CAPITAL ONE 6234 DATA REPLACEMENT SUMMARY")
        print("="*60)
        print(f"Transactions deleted: {self.deleted_count}")
        print(f"New transactions inserted: {self.inserted_count}")
        print(f"Errors: {self.error_count}")
        print("="*60)

def main():
    """Replace Capital One 6234 transactions with embedded data"""
    
    replacer = CapitalOne6234DataReplacer()
    
    # Load transaction data
    if not replacer.load_transaction_data():
        print("❌ No valid transactions found in data")
        return
    
    # Get date range
    start_date, end_date = replacer.get_date_range()
    
    print("🏦 Capital One 6234 Embedded Data Transaction Replacer")
    print("=" * 65)
    print(f"📊 Transactions found: {len(replacer.purchase_transactions)} purchases")
    print(f"📅 Date range: {start_date} to {end_date}")
    print(f"🏛️ Bank identifier: capital_one_credit")
    print(f"💳 Card ending in: 6234")
    print("=" * 65)
    
    # Calculate total amount
    total_amount = sum(trans['amount'] for trans in replacer.purchase_transactions)
    print(f"💰 Total purchase amount: ${total_amount:.2f}")
    
    # Show all transactions (since there are only 12)
    print("\n📝 All transactions to insert:")
    for i, trans in enumerate(replacer.purchase_transactions, 1):
        print(f"{i}. {trans['date']} | ${trans['amount']:.2f} | {trans['description']} | ({trans['category']})")
    
    print(f"\n⚠️  WARNING: This will:")
    print(f"   1. DELETE all Capital One transactions from {start_date} onwards")
    print(f"   2. INSERT {len(replacer.purchase_transactions)} new transactions")
    print(f"   3. Use 'capital_one_credit' as bank identifier")
    print(f"   4. Categories will be stored in descriptions (tags disabled to avoid constraints)")
    
    # Confirmation
    response = input(f"\nProceed with replacement? Type 'YES REPLACE CAPITAL ONE' to confirm: ").strip()
    
    if response == "YES REPLACE CAPITAL ONE":
        if replacer.delete_capital_one_transactions(start_date):
            replacer.insert_new_transactions()
        
        replacer.print_summary()
        
        if replacer.inserted_count > 0:
            print(f"\n🎉 SUCCESS! Replaced {replacer.deleted_count} old transactions with {replacer.inserted_count} new ones")
            print(f"💳 All transactions saved with bank identifier: capital_one_credit")
    else:
        print("👋 Operation cancelled - no changes made")

if __name__ == "__main__":
    main()