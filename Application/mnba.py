import sqlite3
import os
import sys
from datetime import datetime

# Add the root folder to Python's module search path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

class MBNA4515DataReplacer:
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
        print("📄 Loading MBNA 4515 transaction data...")
        
        # March 2025 data
        march_data = [
            {"Posted Date": "02/04/2025", "Payee": "UBER CANADA/UBERONE TORONTO ON", "Address": "TORONTO", "Amount": -11.49},
            {"Posted Date": "02/10/2025", "Payee": "UBER CANADA/UBEREATS TORONTO ON", "Address": "TORONTO", "Amount": -58.91},
            {"Posted Date": "02/10/2025", "Payee": "AMAZON PRIME FR PARIS FRA", "Address": "PARIS", "Amount": -10.67},
            {"Posted Date": "02/12/2025", "Payee": "PAYMENT", "Address": "", "Amount": 100.00},  # Payment - will be excluded
            {"Posted Date": "02/18/2025", "Payee": "GOOGLE *Google One 650-253-0000 NS", "Address": "650-253-0000", "Amount": -31.03},
            {"Posted Date": "03/03/2025", "Payee": "INTEREST CHARGE", "Address": "", "Amount": -6.59}
        ]
        
        # February 2025 data
        february_data = [
            {"Posted Date": "01/06/2025", "Payee": "UBER CANADA/UBEREATS TORONTO ON", "Address": "TORONTO", "Amount": -41.16},
            {"Posted Date": "01/06/2025", "Payee": "OCULUS *LQ64HGL2B2 Menlo Park CA", "Address": "Menlo Park", "Amount": -6.66},
            {"Posted Date": "01/07/2025", "Payee": "PAYMENT", "Address": "", "Amount": 900.00},  # Payment - will be excluded
            {"Posted Date": "01/13/2025", "Payee": "UBER CANADA/UBEREATS TORONTO ON", "Address": "TORONTO", "Amount": -51.66},
            {"Posted Date": "01/13/2025", "Payee": "AMAZON PRIME FR PARIS FRA", "Address": "PARIS", "Amount": -10.64},
            {"Posted Date": "01/17/2025", "Payee": "GOOGLE *ONE AI Premium 650-253-0000 NS", "Address": "650-253-0000", "Amount": -31.03},
            {"Posted Date": "01/20/2025", "Payee": "UBER CANADA/UBEREATS TORONTO ON", "Address": "TORONTO", "Amount": -51.66},
            {"Posted Date": "01/27/2025", "Payee": "UBER CANADA/UBEREATS TORONTO ON", "Address": "TORONTO", "Amount": -51.93},
            {"Posted Date": "01/31/2025", "Payee": "UBER* TRIP TORONTO ON", "Address": "TORONTO", "Amount": -13.48},
            {"Posted Date": "02/03/2025", "Payee": "UBER* EATS TORONTO ON", "Address": "TORONTO", "Amount": -95.48},
            {"Posted Date": "02/03/2025", "Payee": "UBER CANADA/UBERTRIP TORONTO ON", "Address": "TORONTO", "Amount": -9.67},
            {"Posted Date": "02/03/2025", "Payee": "UBER CANADA/UBEREATS TORONTO ON", "Address": "TORONTO", "Amount": -81.96},
            {"Posted Date": "02/03/2025", "Payee": "UBER CANADA/UBEREATS TORONTO ON", "Address": "TORONTO", "Amount": -8.18},
            {"Posted Date": "02/07/2025", "Payee": "PAYMENT", "Address": "", "Amount": 170.00}  # Payment - will be excluded
        ]
        
        # January 2025 data  
        january_data = [
            {"Posted Date": "12/06/2024", "Payee": "OCULUS *9BXF6FQ2B2 Menlo Park CA", "Address": "Menlo Park", "Amount": -6.66},
            {"Posted Date": "12/09/2024", "Payee": "WENDY'S RESTUARANTS LAVAL QC", "Address": "LAVAL", "Amount": -40.62},
            {"Posted Date": "12/10/2024", "Payee": "UBER CANADA/UBEREATS TORONTO ON", "Address": "TORONTO", "Amount": -45.72},
            {"Posted Date": "12/11/2024", "Payee": "AMAZON PRIME FR PARIS FRA", "Address": "PARIS", "Amount": -10.73},
            {"Posted Date": "12/11/2024", "Payee": "PAYMENT", "Address": "", "Amount": 224.00},  # Payment - will be excluded
            {"Posted Date": "12/13/2024", "Payee": "UBER CANADA/UBEREATS TORONTO ON", "Address": "TORONTO", "Amount": -50.79},
            {"Posted Date": "12/16/2024", "Payee": "UBER CANADA/UBEREATS TORONTO ON", "Address": "TORONTO", "Amount": -54.64},
            {"Posted Date": "12/16/2024", "Payee": "MAXI #8634 LAVAL QC", "Address": "LAVAL", "Amount": -10.35},
            {"Posted Date": "12/16/2024", "Payee": "MAXI #8634 LAVAL QC", "Address": "LAVAL", "Amount": -121.79},
            {"Posted Date": "12/17/2024", "Payee": "GOOGLE *ONE AI Premium 650-253-0000 NS", "Address": "650-253-0000", "Amount": -31.03},
            {"Posted Date": "12/18/2024", "Payee": "UBER* TRIP TORONTO ON", "Address": "TORONTO", "Amount": -32.34},
            {"Posted Date": "12/18/2024", "Payee": "UBER CANADA/UBERTRIP TORONTO ON", "Address": "TORONTO", "Amount": -4.84},
            {"Posted Date": "12/19/2024", "Payee": "UBER CANADA/UBERTRIP TORONTO ON", "Address": "TORONTO", "Amount": -13.50},
            {"Posted Date": "12/19/2024", "Payee": "MCDONALD'S #40380 LAVAL QC", "Address": "LAVAL", "Amount": -12.64},
            {"Posted Date": "12/19/2024", "Payee": "MCDONALD'S #41226 LAVAL QC", "Address": "LAVAL", "Amount": -6.19},
            {"Posted Date": "12/19/2024", "Payee": "WAL-MART #3047 LAVAL QC", "Address": "LAVAL", "Amount": -35.25},
            {"Posted Date": "12/23/2024", "Payee": "Uniqlo Canada POS_CA_M Montreal QC", "Address": "Montreal", "Amount": -91.77},
            {"Posted Date": "12/23/2024", "Payee": "TOM-Americas BBQ Montreal QC", "Address": "Montreal", "Amount": -36.04},
            {"Posted Date": "12/23/2024", "Payee": "DESJARDINS GESTION IMM MONTREAL QC", "Address": "MONTREAL", "Amount": -9.00},
            {"Posted Date": "12/23/2024", "Payee": "UBER CANADA/UBEREATS TORONTO ON", "Address": "TORONTO", "Amount": -32.54},
            {"Posted Date": "12/23/2024", "Payee": "MCDONALD'S #41226 LAVAL QC", "Address": "LAVAL", "Amount": -23.53},
            {"Posted Date": "12/27/2024", "Payee": "UBER* EATS TORONTO ON", "Address": "TORONTO", "Amount": -44.26},
            {"Posted Date": "12/27/2024", "Payee": "UBER CANADA/UBEREATS TORONTO ON", "Address": "TORONTO", "Amount": -49.05},
            {"Posted Date": "12/30/2024", "Payee": "CANADIAN TIRE #300 LAVAL QC", "Address": "LAVAL", "Amount": -87.37},
            {"Posted Date": "12/30/2024", "Payee": "UBER CANADA/UBEREATS TORONTO ON", "Address": "TORONTO", "Amount": -52.80},
            {"Posted Date": "12/30/2024", "Payee": "WAL-MART #3047 LAVAL QC", "Address": "LAVAL", "Amount": -6.90},
            {"Posted Date": "12/30/2024", "Payee": "UBER CANADA/UBERONE TORONTO ON", "Address": "TORONTO", "Amount": -7.31}
        ]
        
        # Combine all data
        all_data = march_data + february_data + january_data
        
        # Process only purchase transactions (negative amounts)
        for transaction in all_data:
            if transaction["Amount"] < 0:  # Only purchases
                processed_transaction = {
                    'date': self.convert_date_format(transaction["Posted Date"]),
                    'description': self.clean_description(transaction["Payee"], transaction["Address"]),
                    'amount': abs(transaction["Amount"])  # Convert to positive
                }
                self.purchase_transactions.append(processed_transaction)
        
        print(f"✅ Loaded {len(self.purchase_transactions)} purchase transactions")
        return len(self.purchase_transactions) > 0
    
    def convert_date_format(self, date_str):
        """Convert MM/DD/YYYY to YYYY-MM-DD format"""
        try:
            date_obj = datetime.strptime(date_str, "%m/%d/%Y")
            return date_obj.strftime("%Y-%m-%d")
        except ValueError:
            try:
                date_obj = datetime.strptime(date_str, "%m/%d/%y")
                return date_obj.strftime("%Y-%m-%d")
            except ValueError:
                print(f"⚠️ Could not parse date: {date_str}")
                return date_str
    
    def clean_description(self, payee, address):
        """Clean up the description by combining payee and relevant address info"""
        clean_payee = ' '.join(payee.split())
        clean_address = ' '.join(address.split()) if address else ''
        
        # For local merchants, include city from address
        if clean_address and any(city in clean_address.upper() for city in ['LAVAL', 'MONTREAL', 'TORONTO']):
            for city in ['LAVAL', 'MONTREAL', 'TORONTO']:
                if city in clean_address.upper():
                    if city not in clean_payee.upper():
                        clean_payee = f"{clean_payee} {city}"
                    break
        
        # Clean up common patterns
        clean_payee = clean_payee.replace('CANADA/', '').strip()
        
        return clean_payee
    
    def delete_mbna_transactions(self, start_date):
        """Delete all MBNA transactions from a specific date onwards"""
        conn = self.connect_db()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT COUNT(*) FROM transactions 
                WHERE (bank = 'mbna_credit' OR bank LIKE '%mbna%') 
                AND date >= ?
            """, (start_date,))
            count_to_delete = cursor.fetchone()[0]
            
            if count_to_delete > 0:
                print(f"🗑️ Found {count_to_delete} MBNA transactions to delete (from {start_date} onwards)")
                
                cursor.execute("""
                    DELETE FROM transactions 
                    WHERE (bank = 'mbna_credit' OR bank LIKE '%mbna%') 
                    AND date >= ?
                """, (start_date,))
                
                self.deleted_count = cursor.rowcount
                conn.commit()
                print(f"✅ Deleted {self.deleted_count} MBNA transactions")
            else:
                print(f"📭 No MBNA transactions found to delete from {start_date} onwards")
            
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
                    'bank': 'mbna_credit',
                    'full_email': '',
                    'tags': ''
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
        print("📊 MBNA 4515 DATA REPLACEMENT SUMMARY")
        print("="*60)
        print(f"Transactions deleted: {self.deleted_count}")
        print(f"New transactions inserted: {self.inserted_count}")
        print(f"Errors: {self.error_count}")
        print("="*60)

def main():
    """Replace MBNA 4515 transactions with embedded data"""
    
    replacer = MBNA4515DataReplacer()
    
    # Load transaction data
    if not replacer.load_transaction_data():
        print("❌ No valid transactions found in data")
        return
    
    # Get date range
    start_date, end_date = replacer.get_date_range()
    
    print("🏦 MBNA 4515 Embedded Data Transaction Replacer")
    print("=" * 60)
    print(f"📊 Transactions found: {len(replacer.purchase_transactions)} purchases")
    print(f"📅 Date range: {start_date} to {end_date}")
    print(f"🏛️ Bank identifier: mbna_credit")
    print("=" * 60)
    
    # Calculate total amount
    total_amount = sum(trans['amount'] for trans in replacer.purchase_transactions)
    print(f"💰 Total purchase amount: ${total_amount:.2f}")
    
    # Show first few transactions as sample
    print("\n📝 Sample transactions to insert:")
    for i, trans in enumerate(replacer.purchase_transactions[:10], 1):
        print(f"{i}. {trans['date']} | ${trans['amount']:.2f} | {trans['description']}")
    if len(replacer.purchase_transactions) > 10:
        print(f"... and {len(replacer.purchase_transactions) - 10} more")
    
    print(f"\n⚠️  WARNING: This will:")
    print(f"   1. DELETE all MBNA transactions from {start_date} onwards")
    print(f"   2. INSERT {len(replacer.purchase_transactions)} new transactions")
    print(f"   3. Use 'mbna_credit' as bank identifier")
    
    # Confirmation
    response = input(f"\nProceed with replacement? Type 'YES REPLACE MBNA' to confirm: ").strip()
    
    if response == "YES REPLACE MBNA":
        if replacer.delete_mbna_transactions(start_date):
            replacer.insert_new_transactions()
        
        replacer.print_summary()
        
        if replacer.inserted_count > 0:
            print(f"\n🎉 SUCCESS! Replaced {replacer.deleted_count} old transactions with {replacer.inserted_count} new ones")
            print(f"💳 All transactions saved with bank identifier: mbna_credit")
    else:
        print("👋 Operation cancelled - no changes made")

if __name__ == "__main__":
    main()