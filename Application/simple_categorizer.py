"""
Simple Smart Categorization for ExpenseTracker
NO machine learning dependencies required!
Uses only pattern matching and keyword rules - simple and reliable.
"""

import sqlite3
import re
import json
from typing import Dict, List, Tuple, Optional

class SimpleCategorizer:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.merchant_patterns = self._load_merchant_patterns()
    
    def _load_merchant_patterns(self) -> Dict[str, Tuple[str, float]]:
        """Load Canadian merchant patterns - no ML needed!"""
        return {
            # Groceries (very high confidence)
            r'\bMAXI\b': ('Groceries', 0.95),
            r'\bIGA\b': ('Groceries', 0.95),
            r'\bMETRO\b': ('Groceries', 0.90),
            r'\bPROVIGO\b': ('Groceries', 0.95),
            r'\bCOSTCO\b': ('Groceries', 0.95),
            r'\bWALMART\b': ('Groceries', 0.85),
            r'\bLOBLAWS?\b': ('Groceries', 0.95),
            r'\bSOBEYS\b': ('Groceries', 0.95),
            r'\bSUPER\s*C\b': ('Groceries', 0.95),
            
            # Gas stations (very high confidence)
            r'\bESSO\b': ('Transport', 0.95),
            r'\bSHELL\b': ('Transport', 0.95),
            r'\bPETRO[\s-]?CANADA\b': ('Transport', 0.95),
            r'\bULTRAMAR\b': ('Transport', 0.95),
            r'\bCOUCHE[\s-]?TARD\b': ('Transport', 0.90),
            r'\bCANADIAN\s*TIRE\s*GAS\b': ('Transport', 0.95),
            
            # Fast food chains (high confidence)
            r'\bMCDONALD\'?S?\b': ('Fast Food', 0.90),
            r'\bTIM\s*HORTONS?\b': ('Fast Food', 0.95),
            r'\bSUBWAY\b': ('Fast Food', 0.90),
            r'\bKFC\b': ('Fast Food', 0.95),
            r'\bBURGER\s*KING\b': ('Fast Food', 0.90),
            r'\bA&W\b': ('Fast Food', 0.90),
            r'\bWENDY\'?S\b': ('Fast Food', 0.90),
            
            # Pizza places
            r'\bPIZZA\b': ('Fast Food', 0.85),
            r'\bDOMINO\'?S\b': ('Fast Food', 0.90),
            r'\bPIZZA\s*HUT\b': ('Fast Food', 0.90),
            
            # Restaurants
            r'\bRESTAURANT\b': ('Restaurant', 0.80),
            r'\bST\s*HUBERT\b': ('Restaurant', 0.95),
            r'\bSCORES\b': ('Restaurant', 0.90),
            r'\bBOSTON\s*PIZZA\b': ('Restaurant', 0.90),
            
            # Pharmacies (very high confidence)
            r'\bJEAN\s*COUTU\b': ('Healthcare', 0.95),
            r'\bPHARMAPRIX\b': ('Healthcare', 0.95),
            r'\bREXALL\b': ('Healthcare', 0.95),
            r'\bSHOPPERS\b': ('Healthcare', 0.90),
            r'\bUNIPRIX\b': ('Healthcare', 0.95),
            
            # Online shopping (high confidence)
            r'\bAMZN\b': ('Shopping', 0.90),
            r'\bAMAZON\b': ('Shopping', 0.95),
            r'\bEBAY\b': ('Shopping', 0.90),
            r'\bPAYPAL\b': ('Shopping', 0.80),
            r'\bETSY\b': ('Shopping', 0.90),
            
            # Subscriptions (very high confidence)
            r'\bNETFLIX\b': ('Subscription', 0.95),
            r'\bSPOTIFY\b': ('Subscription', 0.95),
            r'\bYOUTUBE\b': ('Subscription', 0.90),
            r'\bAPPLE\s*MUSIC\b': ('Subscription', 0.95),
            r'\bMICROSOFT\b': ('Subscription', 0.85),
            r'\bADOBE\b': ('Subscription', 0.90),
            
            # Telecommunications (very high confidence)
            r'\bBELL\b': ('Telecommunications', 0.95),
            r'\bROGERS\b': ('Telecommunications', 0.95),
            r'\bTELUS\b': ('Telecommunications', 0.95),
            r'\bVIDEOTRON\b': ('Telecommunications', 0.95),
            r'\bFIDO\b': ('Telecommunications', 0.95),
            r'\bVIRGIN\b': ('Telecommunications', 0.90),
            
            # Coffee shops
            r'\bSTARBUCKS\b': ('Fast Food', 0.95),
            r'\bSECOND\s*CUP\b': ('Fast Food', 0.95),
            
            # Department stores
            r'\bCANADIAN\s*TIRE\b': ('Home Improvement', 0.85),
            r'\bHOME\s*DEPOT\b': ('Home Improvement', 0.90),
            r'\bLOWE\'?S\b': ('Home Improvement', 0.90),
            r'\bRENO[\s-]?DEPOT\b': ('Home Improvement', 0.90),
            
            # Banking/ATM
            r'\bINTERAC\b': ('Banking', 0.95),
            r'\bATM\s*FEE\b': ('Banking', 0.95),
            r'\bBANK\s*FEE\b': ('Banking', 0.95),
            r'\bSERVICE\s*CHARGE\b': ('Banking', 0.95),
            
            # Food delivery (very common in your data)
            r'\bUBER\s*EATS?\b': ('Food Delivery', 0.95),
            r'\bSKIP\s*THE\s*DISHES\b': ('Food Delivery', 0.95),
            r'\bDOOR\s*DASH\b': ('Food Delivery', 0.95),
            
            # Education (specific to your transactions)
            r'\bTELUQ\b': ('Education', 0.95),
            r'\bCOLLEGE\s*MONTMORENCY\b': ('Education', 0.95),
            
            # YouTube/Google services
            r'\bGOOGLE\s*\*?YOUTUBE\b': ('Subscription', 0.95),
            r'\bYOUTUBE\s*PREMIUM\b': ('Subscription', 0.95),
            
            # Money transfers
            r'\bSENDWAVE\b': ('Transfer', 0.90),
            r'\bE[\-\s]?TRANSFER\b': ('Transfer', 0.90),
            
            # Transportation
            r'\bUBER\s*TRIP\b': ('Transport', 0.90),
            
            # Insurance
            r'\bASSURANCE\b': ('Insurance', 0.90),
            r'\bINSURANCE\b': ('Insurance', 0.90),
            
            # Sports/Entertainment subscriptions
            r'\bTHE\s*ATHLETIC\b': ('Subscription', 0.90),
            
            # Shopping centers
            r'\bROYALMOUNT\b': ('Shopping', 0.80),
        }
    
    def categorize_transaction(self, description: str, amount: float) -> Tuple[str, float]:
        """
        Simple pattern matching - no ML complexity!
        Returns (category, confidence_score)
        """
        description_upper = description.upper()
        
        # Check all patterns
        best_match = None
        best_confidence = 0.0
        
        for pattern, (category, confidence) in self.merchant_patterns.items():
            if re.search(pattern, description_upper):
                if confidence > best_confidence:
                    best_match = category
                    best_confidence = confidence
        
        # Simple amount-based fallbacks (no ML needed)
        if not best_match:
            if amount < 3.0:
                return 'Convenience', 0.3
            elif amount > 1000.0:
                return 'Home Improvement', 0.3
            elif 'TRANSFER' in description_upper or 'VIREMENT' in description_upper:
                return 'Transfer', 0.8
        
        return best_match or 'Uncategorized', best_confidence
    
    def bulk_categorize_uncategorized(self) -> Dict[str, int]:
        """Categorize all uncategorized transactions - simple and fast!"""
        results = {'updated': 0, 'skipped': 0, 'errors': 0}
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get uncategorized transactions
                cursor.execute("""
                    SELECT id, description, amount 
                    FROM transactions 
                    WHERE category = 'Uncategorized' OR category IS NULL
                """)
                
                transactions = cursor.fetchall()
                print(f"Processing {len(transactions)} uncategorized transactions...")
                
                for tx_id, description, amount in transactions:
                    try:
                        category, confidence = self.categorize_transaction(description, amount)
                        
                        # Only update if we found a good match
                        if category != 'Uncategorized' and confidence >= 0.7:
                            cursor.execute("""
                                UPDATE transactions 
                                SET category = ? 
                                WHERE id = ?
                            """, (category, tx_id))
                            results['updated'] += 1
                            print(f"  ✅ {description[:40]:<40} → {category}")
                        else:
                            results['skipped'] += 1
                            
                    except Exception as e:
                        print(f"Error categorizing transaction {tx_id}: {e}")
                        results['errors'] += 1
                
                conn.commit()
                
        except Exception as e:
            print(f"Database error: {e}")
            results['errors'] += 1
        
        return results
    
    def add_simple_keyword_rule(self, keyword: str, category: str) -> bool:
        """Add a simple keyword rule - stored in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO keyword_rules (keyword, category, tags)
                    VALUES (?, ?, ?)
                """, (keyword.lower(), category, None))
                conn.commit()
                return True
        except Exception as e:
            print(f"Error adding keyword rule: {e}")
            return False
    
    def apply_keyword_rules(self) -> Dict[str, int]:
        """Apply user-defined keyword rules"""
        results = {'updated': 0, 'skipped': 0}
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get all keyword rules
                cursor.execute("SELECT keyword, category FROM keyword_rules")
                rules = cursor.fetchall()
                
                for keyword, category in rules:
                    # Apply rule to uncategorized transactions
                    cursor.execute("""
                        UPDATE transactions 
                        SET category = ? 
                        WHERE (category = 'Uncategorized' OR category IS NULL)
                        AND UPPER(description) LIKE UPPER(?)
                    """, (category, f'%{keyword}%'))
                    
                    if cursor.rowcount > 0:
                        results['updated'] += cursor.rowcount
                        print(f"  ✅ Rule '{keyword}' → '{category}': {cursor.rowcount} transactions")
                
                conn.commit()
                
        except Exception as e:
            print(f"Error applying keyword rules: {e}")
        
        return results
    
    def suggest_keywords_from_uncategorized(self) -> List[Dict]:
        """Simple keyword suggestions - no ML required"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT description, COUNT(*) as frequency
                    FROM transactions 
                    WHERE category = 'Uncategorized' 
                    GROUP BY description
                    HAVING COUNT(*) >= 2
                    ORDER BY COUNT(*) DESC
                    LIMIT 10
                """)
                
                suggestions = []
                for description, frequency in cursor.fetchall():
                    # Extract the main merchant name (first few words)
                    words = description.split()[:2]
                    if words:
                        keyword = ' '.join(words).strip()
                        suggestions.append({
                            'keyword': keyword.lower(),
                            'frequency': frequency,
                            'example': description,
                            'suggested_category': self._guess_category_from_name(keyword)
                        })
                
                return suggestions
                
        except Exception as e:
            print(f"Error getting suggestions: {e}")
            return []
    
    def _guess_category_from_name(self, name: str) -> str:
        """Simple category guessing - no ML needed"""
        name_upper = name.upper()
        
        if any(word in name_upper for word in ['MARKET', 'GROCERY', 'FOOD']):
            return 'Groceries'
        elif any(word in name_upper for word in ['GAS', 'FUEL', 'STATION']):
            return 'Transport'
        elif any(word in name_upper for word in ['RESTAURANT', 'CAFE', 'BISTRO']):
            return 'Restaurant'
        elif any(word in name_upper for word in ['SHOP', 'STORE', 'BOUTIQUE']):
            return 'Shopping'
        else:
            return 'Miscellaneous'

if __name__ == "__main__":
    # Test the simple categorizer
    import os
    
    db_path = os.path.join(os.path.dirname(__file__), "../Database/transactions.db")
    categorizer = SimpleCategorizer(db_path)
    
    print("🎯 Simple Smart Categorization (NO ML dependencies!)")
    print("=" * 60)
    
    # Test some descriptions
    test_transactions = [
        ("MAXI #8634 LAVAL QC", 31.31),
        ("TIM HORTONS #567 LAVAL", 5.50),
        ("AMZN Mktp CA*DR5DV2143", 114.95),
        ("SHELL #1234 MONTREAL QC", 45.00),
        ("JEAN COUTU #123 LAVAL QC", 12.50),
        ("NETFLIX MONTHLY", 15.99),
        ("INTERAC FEE", 2.50)
    ]
    
    print("🧪 Testing pattern matching:")
    print("-" * 40)
    
    for desc, amount in test_transactions:
        category, confidence = categorizer.categorize_transaction(desc, amount)
        print(f"💳 {desc[:35]:<35} → {category:<15} ({confidence:.0%})")
    
    print(f"\n🔄 Running bulk categorization on your {226} uncategorized transactions...")
    results = categorizer.bulk_categorize_uncategorized()
    
    print(f"\n📊 Results:")
    print(f"✅ Categorized: {results['updated']} transactions")
    print(f"⏭️  Skipped: {results['skipped']} transactions") 
    print(f"❌ Errors: {results['errors']} transactions")
    
    if results['updated'] > 0:
        print(f"\n🎉 Success! Automatically categorized {results['updated']} transactions")
        print("💡 You can now add custom keyword rules for the remaining uncategorized transactions")
    
    print(f"\n💡 Keyword suggestions from remaining uncategorized:")
    suggestions = categorizer.suggest_keywords_from_uncategorized()
    for suggestion in suggestions[:5]:
        print(f"   '{suggestion['keyword']}' ({suggestion['frequency']}x) → {suggestion['suggested_category']}")
        print(f"      Example: {suggestion['example']}")