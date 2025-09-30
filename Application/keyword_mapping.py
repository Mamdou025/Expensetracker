"""
Keyword Mapping Service for ExpenseTracker
Allows users to create custom rules for automatic categorization
"""

import sqlite3
import json
import re
from typing import Dict, List, Optional, Tuple

class KeywordMappingService:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._ensure_keyword_rules_table()
    
    def _ensure_keyword_rules_table(self):
        """Ensure the keyword_rules table exists"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS keyword_rules (
                        keyword TEXT PRIMARY KEY,
                        category TEXT,
                        tags TEXT,
                        priority INTEGER DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                conn.commit()
        except Exception as e:
            print(f"Error creating keyword_rules table: {e}")
    
    def add_keyword_rule(self, keyword: str, category: str, tags: List[str] = None, priority: int = 1) -> bool:
        """Add a new keyword rule for automatic categorization"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                tags_json = json.dumps(tags) if tags else None
                
                cursor.execute("""
                    INSERT OR REPLACE INTO keyword_rules (keyword, category, tags, priority)
                    VALUES (?, ?, ?, ?)
                """, (keyword.lower(), category, tags_json, priority))
                
                conn.commit()
                return True
        except Exception as e:
            print(f"Error adding keyword rule: {e}")
            return False
    
    def get_all_keyword_rules(self) -> List[Dict]:
        """Get all keyword rules ordered by priority"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT keyword, category, tags, priority 
                    FROM keyword_rules 
                    ORDER BY priority DESC, keyword
                """)
                
                rules = []
                for row in cursor.fetchall():
                    keyword, category, tags_json, priority = row
                    tags = json.loads(tags_json) if tags_json else []
                    rules.append({
                        'keyword': keyword,
                        'category': category,
                        'tags': tags,
                        'priority': priority
                    })
                
                return rules
        except Exception as e:
            print(f"Error getting keyword rules: {e}")
            return []
    
    def delete_keyword_rule(self, keyword: str) -> bool:
        """Delete a keyword rule"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM keyword_rules WHERE keyword = ?", (keyword.lower(),))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Error deleting keyword rule: {e}")
            return False
    
    def apply_keyword_rules(self, description: str) -> Tuple[Optional[str], List[str]]:
        """
        Apply keyword rules to a transaction description
        Returns (category, tags) if match found, otherwise (None, [])
        """
        description_lower = description.lower()
        rules = self.get_all_keyword_rules()
        
        # Check rules in priority order
        for rule in rules:
            if rule['keyword'] in description_lower:
                return rule['category'], rule['tags']
        
        return None, []
    
    def suggest_keywords_from_uncategorized(self, limit: int = 50) -> List[Dict]:
        """
        Analyze uncategorized transactions to suggest potential keywords
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get frequent words from uncategorized transactions
                cursor.execute("""
                    SELECT description 
                    FROM transactions 
                    WHERE category = 'Uncategorized' 
                    ORDER BY amount DESC 
                    LIMIT ?
                """, (limit,))
                
                descriptions = [row[0] for row in cursor.fetchall()]
                
                # Extract words and count frequency
                word_freq = {}
                for desc in descriptions:
                    # Clean and split description
                    words = re.findall(r'\b[A-Za-z]{3,}\b', desc.upper())
                    for word in words:
                        if len(word) >= 3:  # Ignore short words
                            word_freq[word] = word_freq.get(word, 0) + 1
                
                # Sort by frequency and return suggestions
                suggestions = []
                for word, count in sorted(word_freq.items(), key=lambda x: x[1], reverse=True):
                    if count >= 2:  # Only suggest words that appear multiple times
                        suggestions.append({
                            'keyword': word.lower(),
                            'frequency': count,
                            'suggested_category': self._suggest_category_for_word(word)
                        })
                
                return suggestions[:20]  # Return top 20 suggestions
                
        except Exception as e:
            print(f"Error analyzing uncategorized transactions: {e}")
            return []
    
    def _suggest_category_for_word(self, word: str) -> str:
        """Suggest a category based on common word patterns"""
        word_lower = word.lower()
        
        category_keywords = {
            'Groceries': ['maxi', 'iga', 'metro', 'costco', 'walmart'],
            'Transport': ['esso', 'shell', 'petro', 'gas', 'station'],
            'Restaurant': ['restaurant', 'resto', 'pizza', 'burger'],
            'Healthcare': ['pharmacie', 'pharmacy', 'medical', 'clinic'],
            'Shopping': ['amazon', 'store', 'boutique', 'shop'],
            'Telecommunications': ['bell', 'rogers', 'telus', 'phone'],
            'Banking': ['bank', 'fee', 'charge', 'interac']
        }
        
        for category, keywords in category_keywords.items():
            if any(kw in word_lower for kw in keywords):
                return category
        
        return 'Miscellaneous'
    
    def bulk_apply_rules(self) -> Dict[str, int]:
        """Apply all keyword rules to uncategorized transactions"""
        results = {'updated': 0, 'skipped': 0}
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get uncategorized transactions
                cursor.execute("""
                    SELECT id, description 
                    FROM transactions 
                    WHERE category = 'Uncategorized'
                """)
                
                transactions = cursor.fetchall()
                
                for tx_id, description in transactions:
                    category, tags = self.apply_keyword_rules(description)
                    
                    if category:
                        # Update category
                        cursor.execute("""
                            UPDATE transactions 
                            SET category = ? 
                            WHERE id = ?
                        """, (category, tx_id))
                        
                        # Add tags if specified
                        if tags:
                            self._add_tags_to_transaction(cursor, tx_id, tags)
                        
                        results['updated'] += 1
                    else:
                        results['skipped'] += 1
                
                conn.commit()
                
        except Exception as e:
            print(f"Error applying keyword rules: {e}")
        
        return results
    
    def _add_tags_to_transaction(self, cursor, transaction_id: int, tags: List[str]):
        """Helper method to add tags to a transaction"""
        for tag_name in tags:
            try:
                # Ensure tag exists
                cursor.execute("INSERT OR IGNORE INTO tags (tag_name) VALUES (?)", (tag_name,))
                
                # Get tag ID
                cursor.execute("SELECT id FROM tags WHERE tag_name = ?", (tag_name,))
                tag_id = cursor.fetchone()[0]
                
                # Link tag to transaction
                cursor.execute("""
                    INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) 
                    VALUES (?, ?)
                """, (transaction_id, tag_id))
                
            except Exception as e:
                print(f"Error adding tag {tag_name} to transaction {transaction_id}: {e}")

if __name__ == "__main__":
    # Test the keyword mapping service
    import os
    db_path = os.path.join(os.path.dirname(__file__), "../Database/transactions.db")
    
    service = KeywordMappingService(db_path)
    
    # Add some example rules
    print("📝 Adding example keyword rules...")
    
    example_rules = [
        ("amazon", "Shopping", ["online", "ecommerce"], 3),
        ("maxi", "Groceries", ["food", "essential"], 3),
        ("netflix", "Subscription", ["entertainment", "streaming"], 2),
        ("uber", "Transport", ["rideshare"], 2),
        ("tim hortons", "Fast Food", ["coffee"], 1),
    ]
    
    for keyword, category, tags, priority in example_rules:
        success = service.add_keyword_rule(keyword, category, tags, priority)
        print(f"{'✅' if success else '❌'} {keyword} → {category}")
    
    print("\n🔍 Analyzing uncategorized transactions...")
    suggestions = service.suggest_keywords_from_uncategorized()
    
    print(f"\n💡 Top keyword suggestions:")
    for suggestion in suggestions[:10]:
        print(f"   {suggestion['keyword']:<15} ({suggestion['frequency']} times) → {suggestion['suggested_category']}")
    
    print("\n🔄 Applying keyword rules...")
    results = service.bulk_apply_rules()
    print(f"✅ Updated: {results['updated']} transactions")
    print(f"⏭️  Skipped: {results['skipped']} transactions")