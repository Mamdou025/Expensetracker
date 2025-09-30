# Smart Categorization System for ExpenseTracker

## Overview

The Smart Categorization System automatically categorizes your transactions using multiple approaches:
- **Pattern-Based Matching**: Uses merchant name patterns and rules
- **Keyword Rules**: User-defined keyword-to-category mappings  
- **Machine Learning**: Learns from your existing categorized transactions

## Setup Instructions

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

This installs the required ML libraries (scikit-learn, pandas, numpy, joblib).

### 2. Test the Smart Categorizer

```bash
python Application/smart_categorizer.py
```

This will:
- Analyze your existing transactions
- Apply pattern-based categorization
- Show results and statistics

### 3. Set Up Keyword Rules

```bash
python Application/keyword_mapping.py
```

This will:
- Add example keyword rules
- Analyze uncategorized transactions for suggestions
- Apply keyword rules to transactions

### 4. Train the ML Model (Optional)

```bash
python Application/ml_categorizer.py
```

This will:
- Train a machine learning model on your categorized transactions
- Predict categories for uncategorized transactions
- Show model performance metrics

## Using the Web Interface

### Smart Categorization Settings

Navigate to the Settings section in your dashboard to access:

1. **Overview Tab**
   - See categorization statistics
   - Run smart categorization with one click
   - View uncategorized transaction count

2. **Keyword Rules Tab**
   - Add custom keyword rules
   - View and manage existing rules
   - Set priority levels for rules

3. **Suggestions Tab**
   - See AI-suggested keywords from uncategorized transactions
   - Quick-create rules from suggestions
   - Frequency analysis of merchant names

4. **Machine Learning Tab**
   - Train ML models on your data
   - View model performance
   - Run ML predictions with confidence thresholds

## How It Works

### 1. Pattern-Based Categorization

The system recognizes common merchant patterns:

- **Groceries**: MAXI, IGA, METRO, COSTCO, WALMART
- **Gas Stations**: ESSO, SHELL, PETRO-CANADA, ULTRAMAR
- **Restaurants**: MCDONALD'S, TIM HORTONS, PIZZA
- **Pharmacies**: JEAN COUTU, PHARMAPRIX, SHOPPERS
- **Online Shopping**: AMAZON, PAYPAL, EBAY
- **Subscriptions**: NETFLIX, SPOTIFY, YOUTUBE

### 2. Keyword Rules Engine

Users can create custom rules:

```
Keyword: "amazon"
Category: "Shopping"
Tags: ["online", "ecommerce"]
Priority: High
```

### 3. Machine Learning

The ML model:
- Uses TF-IDF vectorization on merchant names
- Combines amount ranges and bank information
- Learns from your categorization patterns
- Provides confidence scores for predictions

## API Endpoints

### Smart Categorization
- `GET /api/smart-categorization/stats` - Get categorization statistics
- `POST /api/smart-categorization/run` - Run pattern-based categorization

### Keyword Rules
- `GET /api/keyword-rules` - Get all keyword rules
- `POST /api/keyword-rules` - Create new keyword rule
- `DELETE /api/keyword-rules/:keyword` - Delete keyword rule
- `GET /api/keyword-rules/suggestions` - Get keyword suggestions

### Machine Learning
- `POST /api/ml-categorization/train` - Train ML model
- `GET /api/ml-categorization/stats` - Get model performance
- `POST /api/ml-categorization/predict` - Run ML predictions

## Best Practices

### 1. Start with Pattern-Based Rules
- Run the smart categorizer first to catch obvious merchants
- This will categorize 60-80% of transactions automatically

### 2. Add Custom Keyword Rules
- Review uncategorized transactions for patterns
- Create rules for frequently appearing merchants
- Use high priority for specific rules, low for general ones

### 3. Train ML Model Gradually
- Manually categorize 50-100 transactions first
- Train the ML model on this data  
- The model improves as you add more categorized data

### 4. Regular Maintenance
- Review suggestions periodically
- Add rules for new merchants
- Retrain ML model monthly as data grows

## Performance Tips

### Confidence Thresholds
- Use higher confidence (0.8+) for automatic ML categorization
- Lower confidence (0.5+) for review/suggestion mode
- Pattern-based rules typically have 85-95% confidence

### Data Quality
- Clean up duplicate categories (e.g., "Food" vs "Food Delivery")
- Use consistent category names
- Remove or merge low-usage categories

### Model Retraining
- Retrain when you have 20%+ more categorized data
- Monitor accuracy - retrain if it drops below 70%
- Consider seasonal patterns in spending

## Troubleshooting

### ML Model Issues
- **"Insufficient training data"**: Need at least 10 categorized transactions
- **Low accuracy**: Clean up inconsistent categories, add more training data
- **Import errors**: Install ML dependencies with `pip install scikit-learn pandas`

### Pattern Matching Issues
- **Wrong categories**: Add specific exclude keywords to config.yml
- **Missing merchants**: Add new patterns to smart_categorizer.py
- **False positives**: Increase pattern specificity

### Performance Issues
- **Slow categorization**: Process in smaller batches
- **Memory issues**: For large datasets, consider chunked processing
- **Database locks**: Ensure only one categorization process runs at a time

## Examples

### Adding a Keyword Rule via API
```javascript
fetch('/api/keyword-rules', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    keyword: 'starbucks',
    category: 'Coffee',
    tags: ['coffee', 'beverage'],
    priority: 2
  })
});
```

### Training ML Model
```python
from ml_categorizer import MLCategorizer

categorizer = MLCategorizer("../Database/transactions.db")
results = categorizer.train_model()
print(f"Model accuracy: {results['accuracy']:.1%}")
```

### Pattern-Based Categorization
```python
from smart_categorizer import SmartCategorizer

categorizer = SmartCategorizer("../Database/transactions.db")
results = categorizer.bulk_categorize_uncategorized()
print(f"Updated {results['updated']} transactions")
```

This smart categorization system should significantly reduce manual categorization work and improve the accuracy of your expense tracking!