"""
Smart Categorization System for ExpenseTracker
Automatically categorizes transactions based on merchant patterns and learning
"""

import re
import sqlite3
import json
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

@dataclass
class CategoryRule:
    patterns: List[str]
    category: str
    confidence: float

class SmartCategorizer:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.merchant_patterns = self._load_merchant_patterns()
        self.learned_rules = self._load_learned_rules()
    
    def _load_merchant_patterns(self) -> Dict[str, CategoryRule]:
        """Load predefined merchant patterns for auto-categorization"""
        patterns = {
            'groceries': CategoryRule([
                r'MAXI\b', r'IGA\b', r'METRO\b', r'PROVIGO\b', r'COSTCO\b',
                r'WALMART\b', r'LOBLAWS\b', r'SOBEYS\b', r'SUPER\s*C\b',
                r'EPICERIE', r'GROCERY', r'MARCHE\b'
            ], 'Groceries', 0.9),
            
            'gas_stations': CategoryRule([
                r'ESSO\b', r'SHELL\b', r'PETRO[\s-]CANADA\b', r'ULTRAMAR\b',
                r'COUCHE[\s-]TARD\b', r'CANADIAN\s*TIRE\s*GAS\b',
                r'STATION[\s-]SERVICE', r'GAZ\b', r'PETROLE\b'
            ], 'Transport', 0.95),
            
            'restaurants': CategoryRule([
                r'MCDONALD\'?S?\b', r'TIM\s*HORTONS?\b', r'SUBWAY\b', r'KFC\b',
                r'BURGER\s*KING\b', r'PIZZA\b', r'RESTAURANT\b', r'RESTO\b',
                r'ST[\-\s]HUBERT\b', r'SCORES\b'
            ], 'Restaurant', 0.85),
            
            'fast_food': CategoryRule([
                r'UBER\s*EATS?\b', r'SKIP\s*THE\s*DISHES\b', r'DOOR\s*DASH\b',
                r'JUST\s*EAT\b', r'DELIVEROO\b', r'FOODORA\b'
            ], 'Food Delivery', 0.9),
            
            'pharmacies': CategoryRule([
                r'JEAN\s*COUTU\b', r'PHARMAPRIX\b', r'REXALL\b', r'SHOPPERS\b',
                r'PHARMACIE\b', r'PHARMACY\b', r'UNIPRIX\b'
            ], 'Healthcare', 0.9),
            
            'online_shopping': CategoryRule([
                r'AMZN\b', r'AMAZON\b', r'EBAY\b', r'PAYPAL\b',
                r'APPLE\.COM\b', r'GOOGLE\s*PAY\b', r'ETSY\b'
            ], 'Shopping', 0.8),
            
            'subscriptions': CategoryRule([
                r'NETFLIX\b', r'SPOTIFY\b', r'YOUTUBE\b', r'APPLE\s*MUSIC\b',
                r'MICROSOFT\b', r'ADOBE\b', r'SUBSCRIPTION\b', r'MONTHLY\b'
            ], 'Subscription', 0.9),
            
            'telecom': CategoryRule([
                r'BELL\b', r'ROGERS\b', r'TELUS\b', r'VIDEOTRON\b',
                r'FIDO\b', r'VIRGIN\b', r'CHATR\b', r'FREEDOM\b'
            ], 'Telecommunications', 0.95),
            
            'banking': CategoryRule([
                r'INTERAC\b', r'ATM\s*FEE\b', r'BANK\s*FEE\b', r'SERVICE\s*CHARGE\b',
                r'MONTHLY\s*FEE\b', r'TRANSFER\b', r'VIREMENT\b'
            ], 'Banking', 0.9)
        }
        return patterns
    
    def _load_learned_rules(self) -> Dict[str, str]:
        """Load user-corrected categorizations to learn from"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get user-corrected transactions (not Uncategorized)
                cursor.execute("""
                    SELECT DISTINCT description, category 
                    FROM transactions 
                    WHERE category != 'Uncategorized' 
                    AND category IS NOT NULL
                """)
                
                learned = {}
                for desc, category in cursor.fetchall():
                    # Extract merchant name (first few words usually)
                    merchant = self._extract_merchant_name(desc)
                    if merchant:
                        learned[merchant.upper()] = category
                
                return learned
        except Exception as e:
            print(f"Error loading learned rules: {e}")
            return {}
    
    def _extract_merchant_name(self, description: str) -> Optional[str]:
        """Extract the main merchant name from transaction description"""
        # Remove common prefixes and suffixes
        cleaned = re.sub(r'#\d+', '', description)  # Remove store numbers
        cleaned = re.sub(r'\s+[A-Z]{2}$', '', cleaned)  # Remove province codes
        cleaned = re.sub(r'\s+\d{5,}$', '', cleaned)  # Remove postal codes
        
        # Take first 2-3 words as merchant name
        words = cleaned.split()[:3]
        return ' '.join(words) if words else None
    
    def categorize_transaction(self, description: str, amount: float) -> Tuple[str, float]:
        """
        Categorize a transaction based on description and amount
        Returns (category, confidence_score)
        """
        description_upper = description.upper()
        
        # First check learned rules (highest priority)
        merchant = self._extract_merchant_name(description)
        if merchant and merchant.upper() in self.learned_rules:
            return self.learned_rules[merchant.upper()], 1.0
        
        # Check pattern-based rules
        best_match = None
        best_confidence = 0.0
        
        for rule_type, rule in self.merchant_patterns.items():
            for pattern in rule.patterns:
                if re.search(pattern, description_upper):
                    if rule.confidence > best_confidence:
                        best_match = rule.category
                        best_confidence = rule.confidence
        
        # Amount-based heuristics for edge cases
        if not best_match:
            if amount < 5.0:
                return 'Convenience', 0.3
            elif amount > 500.0:
                return 'Home Improvement', 0.3
        
        return best_match or 'Uncategorized', best_confidence
    
    def bulk_categorize_uncategorized(self) -> Dict[str, int]:
        """Categorize all uncategorized transactions"""
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
                
                for tx_id, description, amount in transactions:
                    try:
                        category, confidence = self.categorize_transaction(description, amount)
                        
                        # Only update if confidence is reasonable
                        if confidence >= 0.5:
                            cursor.execute("""
                                UPDATE transactions 
                                SET category = ? 
                                WHERE id = ?
                            """, (category, tx_id))
                            results['updated'] += 1
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

if __name__ == "__main__":
    # Test the categorizer
    import os
    db_path = os.path.join(os.path.dirname(__file__), "../Database/transactions.db")
    
    categorizer = SmartCategorizer(db_path)
    
    # Test some descriptions
    test_transactions = [
        ("MAXI #8634 LAVAL QC", 31.31),
        ("CANADIAN TIRE #231 VIMONT LAVAL QC", 634.62),
        ("NETFLIX MONTHLY", 15.99),
        ("SHELL #1234 MONTREAL QC", 45.00),
        ("JEAN COUTU #123 LAVAL QC", 12.50)
    ]
    
    print("🧠 Smart Categorization Test:")
    print("-" * 50)
    
    for desc, amount in test_transactions:
        category, confidence = categorizer.categorize_transaction(desc, amount)
        print(f"💳 {desc[:30]:<30} → {category:<15} ({confidence:.1%})")
    
    print("\n🔄 Running bulk categorization...")
    results = categorizer.bulk_categorize_uncategorized()
    print(f"✅ Updated: {results['updated']}")
    print(f"⏭️  Skipped: {results['skipped']}")
    print(f"❌ Errors: {results['errors']}")