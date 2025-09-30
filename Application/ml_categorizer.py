"""
ML-based Transaction Categorization for ExpenseTracker
Uses machine learning to predict categories based on transaction patterns
"""

import sqlite3
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os
import re
from typing import List, Tuple, Optional, Dict

class MLCategorizer:
    def __init__(self, db_path: str, model_path: Optional[str] = None):
        self.db_path = db_path
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), "categorization_model.pkl")
        self.pipeline = None
        self.is_trained = False
        
    def preprocess_description(self, description: str) -> str:
        """Clean and preprocess transaction description for ML"""
        # Convert to lowercase
        text = description.lower()
        
        # Remove common patterns that don't help with categorization
        text = re.sub(r'#\d+', '', text)  # Remove store numbers
        text = re.sub(r'\d{4,}', '', text)  # Remove long numbers (card numbers, etc.)
        text = re.sub(r'\s+[a-z]{2}$', '', text)  # Remove province codes
        text = re.sub(r'[^\w\s]', ' ', text)  # Remove special characters
        text = re.sub(r'\s+', ' ', text).strip()  # Normalize whitespace
        
        return text
    
    def load_training_data(self) -> pd.DataFrame:
        """Load categorized transactions from database for training"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                query = """
                    SELECT description, amount, bank, category
                    FROM transactions 
                    WHERE category != 'Uncategorized' 
                    AND category IS NOT NULL
                    AND category != ''
                """
                
                df = pd.read_sql_query(query, conn)
                
                # Preprocess descriptions
                df['processed_description'] = df['description'].apply(self.preprocess_description)
                
                # Create feature combinations
                df['amount_range'] = pd.cut(df['amount'], 
                                          bins=[0, 10, 50, 100, 500, float('inf')], 
                                          labels=['very_low', 'low', 'medium', 'high', 'very_high'])
                
                # Combine features for better predictions
                df['features'] = (df['processed_description'] + ' ' + 
                                df['bank'] + ' ' + 
                                df['amount_range'].astype(str))
                
                return df[['features', 'category']]
                
        except Exception as e:
            print(f"Error loading training data: {e}")
            return pd.DataFrame()
    
    def train_model(self, test_size: float = 0.2) -> Dict[str, float]:
        """Train the ML model on existing categorized transactions"""
        print("🤖 Training ML categorization model...")
        
        # Load training data
        df = self.load_training_data()
        
        if df.empty or len(df) < 10:
            print("❌ Insufficient training data. Need at least 10 categorized transactions.")
            return {'accuracy': 0.0, 'training_size': 0}
        
        print(f"📊 Training on {len(df)} transactions with {df['category'].nunique()} categories")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            df['features'], df['category'], 
            test_size=test_size, 
            random_state=42,
            stratify=df['category']
        )
        
        # Create ML pipeline
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(
                ngram_range=(1, 2),  # Use unigrams and bigrams
                max_features=5000,
                min_df=2,  # Ignore terms that appear in less than 2 documents
                stop_words='english'
            )),
            ('classifier', MultinomialNB(alpha=0.1))
        ])
        
        # Train the model
        self.pipeline.fit(X_train, y_train)
        
        # Evaluate on test set
        y_pred = self.pipeline.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"✅ Model trained successfully!")
        print(f"🎯 Accuracy: {accuracy:.1%}")
        print(f"📈 Training size: {len(X_train)} transactions")
        
        # Save the model
        try:
            joblib.dump(self.pipeline, self.model_path)
            print(f"💾 Model saved to {self.model_path}")
        except Exception as e:
            print(f"⚠️ Warning: Could not save model: {e}")
        
        self.is_trained = True
        
        return {
            'accuracy': accuracy,
            'training_size': len(X_train),
            'categories': list(df['category'].unique())
        }
    
    def load_model(self) -> bool:
        """Load a previously trained model"""
        try:
            if os.path.exists(self.model_path):
                self.pipeline = joblib.load(self.model_path)
                self.is_trained = True
                print(f"✅ Model loaded from {self.model_path}")
                return True
            else:
                print(f"❌ No saved model found at {self.model_path}")
                return False
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return False
    
    def predict_category(self, description: str, amount: float, bank: str) -> Tuple[str, float]:
        """
        Predict category for a single transaction
        Returns (predicted_category, confidence)
        """
        if not self.is_trained:
            return "Uncategorized", 0.0
        
        try:
            # Preprocess and create features
            processed_desc = self.preprocess_description(description)
            amount_range = 'very_low' if amount < 10 else 'low' if amount < 50 else 'medium' if amount < 100 else 'high' if amount < 500 else 'very_high'
            
            features = f"{processed_desc} {bank} {amount_range}"
            
            # Get prediction probabilities
            probabilities = self.pipeline.predict_proba([features])[0]
            predicted_category = self.pipeline.predict([features])[0]
            confidence = max(probabilities)
            
            return predicted_category, confidence
            
        except Exception as e:
            print(f"Error predicting category: {e}")
            return "Uncategorized", 0.0
    
    def bulk_predict_uncategorized(self, confidence_threshold: float = 0.6) -> Dict[str, int]:
        """Predict categories for all uncategorized transactions"""
        if not self.is_trained:
            print("❌ Model not trained. Please train or load a model first.")
            return {'updated': 0, 'skipped': 0}
        
        results = {'updated': 0, 'skipped': 0, 'errors': 0}
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get uncategorized transactions
                cursor.execute("""
                    SELECT id, description, amount, bank
                    FROM transactions 
                    WHERE category = 'Uncategorized' OR category IS NULL
                """)
                
                transactions = cursor.fetchall()
                print(f"🔄 Processing {len(transactions)} uncategorized transactions...")
                
                for tx_id, description, amount, bank in transactions:
                    try:
                        predicted_category, confidence = self.predict_category(description, amount, bank)
                        
                        # Only update if confidence is above threshold
                        if confidence >= confidence_threshold:
                            cursor.execute("""
                                UPDATE transactions 
                                SET category = ? 
                                WHERE id = ?
                            """, (predicted_category, tx_id))
                            results['updated'] += 1
                        else:
                            results['skipped'] += 1
                            
                    except Exception as e:
                        print(f"Error processing transaction {tx_id}: {e}")
                        results['errors'] += 1
                
                conn.commit()
                
        except Exception as e:
            print(f"Database error: {e}")
            results['errors'] += 1
        
        return results
    
    def get_model_performance(self) -> Dict:
        """Get performance metrics of the current model"""
        if not self.is_trained:
            return {'status': 'not_trained'}
        
        # Load test data
        df = self.load_training_data()
        if df.empty:
            return {'status': 'no_data'}
        
        # Get predictions for all data (as a simple performance check)
        try:
            predictions = self.pipeline.predict(df['features'])
            accuracy = accuracy_score(df['category'], predictions)
            
            return {
                'status': 'trained',
                'accuracy': accuracy,
                'total_categories': len(df['category'].unique()),
                'training_samples': len(df)
            }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def suggest_retraining(self) -> bool:
        """Check if model should be retrained based on new data"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Count total categorized transactions
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM transactions 
                    WHERE category != 'Uncategorized' AND category IS NOT NULL
                """)
                total_categorized = cursor.fetchone()[0]
                
                # If we have significantly more data than when last trained, suggest retraining
                performance = self.get_model_performance()
                if performance.get('status') == 'trained':
                    last_training_size = performance.get('training_samples', 0)
                    growth_ratio = total_categorized / max(last_training_size, 1)
                    
                    # Suggest retraining if data has grown by 20% or more
                    return growth_ratio >= 1.2
                
                return True  # Suggest training if no model exists
                
        except Exception as e:
            print(f"Error checking retraining need: {e}")
            return False

if __name__ == "__main__":
    # Test the ML categorizer
    import os
    
    db_path = os.path.join(os.path.dirname(__file__), "../Database/transactions.db")
    categorizer = MLCategorizer(db_path)
    
    print("🤖 ML-Based Transaction Categorization Test")
    print("=" * 50)
    
    # Try to load existing model
    if not categorizer.load_model():
        print("📚 No existing model found. Training new model...")
        results = categorizer.train_model()
        
        if results['accuracy'] > 0:
            print(f"✅ Training completed with {results['accuracy']:.1%} accuracy")
        else:
            print("❌ Training failed or insufficient data")
            exit(1)
    
    # Test predictions
    test_transactions = [
        ("MAXI #8634 LAVAL QC", 31.31, "cibc_credit"),
        ("NETFLIX MONTHLY SUBSCRIPTION", 15.99, "cibc_credit"),
        ("SHELL #1234 MONTREAL QC", 45.00, "cibc_credit"),
        ("AMZN Mktp CA*DR5DV2143", 114.95, "cibc_credit"),
        ("TIM HORTONS #567 LAVAL", 5.50, "cibc_credit")
    ]
    
    print("\n🔮 Testing predictions:")
    print("-" * 50)
    
    for desc, amount, bank in test_transactions:
        category, confidence = categorizer.predict_category(desc, amount, bank)
        print(f"💳 {desc[:30]:<30} → {category:<15} ({confidence:.1%})")
    
    # Check if retraining is suggested
    if categorizer.suggest_retraining():
        print("\n💡 Suggestion: Consider retraining the model with new data")
    
    # Get model performance
    performance = categorizer.get_model_performance()
    print(f"\n📊 Model Performance:")
    print(f"   Status: {performance.get('status', 'unknown')}")
    if 'accuracy' in performance:
        print(f"   Accuracy: {performance['accuracy']:.1%}")
        print(f"   Categories: {performance['total_categories']}")
        print(f"   Training samples: {performance['training_samples']}")