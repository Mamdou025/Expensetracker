import json
import re

# Load the JSON file
input_filename = 'desjuidec.json'
output_filename = 'juildec.json'

# Define category mapping based on keywords
category_keywords = {
    "Groceries": ["MAXI", "IGA", "METRO", "BOULANGERIE", "PATISSERIE"],
    "Shopping": ["AMAZON", "WALMART", "SEPHORA"],
    "Rent": ["LOYER", "RENT"],
    "Utilities": ["HYDRO", "ELECTRIC", "WATER"],
    "Transport": ["UBER", "TAXI", "BUS", "TRAIN", "VIA RAIL"],
    "Dining Out": ["RESTAURANT", "JUGO JUICE", "CAFE", "DEPANNEUR", "BANANE"],
    "Entertainment": ["NETFLIX", "DISNEY", "CINEMA"],
    "Food Delivery": ["UBER EATS", "SKIP", "DOORDASH"],
    "Food": ["GROCERY", "FOOD"],
    "Restaurant": ["RESTAURANT", "SUSHI", "PIZZA", "DEPOT", "NOUR", "BANANE"],
    "Fast Food": ["MCDONALD", "BURGER KING", "WENDY'S", "KFC"],
    "Gas Station": ["SHELL", "ESSO", "PETRO"],
    "Travel": ["AIR CANADA", "VIA RAIL", "HOTEL"],
    "Convenience": ["COUCHE-TARD", "DEPANNEUR"],
    "Subscription": ["NETFLIX", "SPOTIFY", "ADOBE"],
    "Services": ["PAYPAL", "PWC", "SERVICE"],
    "Education": ["SCHOOL", "UNIVERSITY", "EDUCATION", "COURSERA"],
    "Healthcare": ["PHARMACY", "HOSPITAL", "CLINIC", "DENTAIRE"],
    "Miscellaneous": ["VARIOUS", "MISCELLANEOUS"],
    "Home Improvement": ["HOME DEPOT", "RENO"],
    "Telecommunications": ["BELL", "VIDEOTRON", "ROGERS"],
    "Other": [],
    "Investments": ["CASH BACK", "INVEST", "STOCK"],
    "Transfer": ["TRANSFER", "VIREMENT"],
    "Debt": ["LOAN", "CREDIT", "DEBT"]
}

def assign_category(description):
    description_upper = description.upper()
    for category, keywords in category_keywords.items():
        if any(keyword in description_upper for keyword in keywords):
            return category
    return "Other"

# Load the JSON data
with open(input_filename, 'r', encoding='utf-8') as file:
    data = json.load(file)

# Process the data
transformed_data = []

for transaction in data:
    if transaction.get('debit') is None:
        continue  # Skip transactions with null debit

    # Extract and transform fields
    amount = transaction.get('debit')
    description = transaction.get('description', '').strip()
    received_date = transaction.get('date', '')
    # Assign category
    category = assign_category(description)

    # Build transformed object
    transformed_transaction = {
        "amount": amount,
        "description": description,
        "card_type": "Dj-CC",
        "date": received_date,
        "time": None,
        "bank": "Dj-CC",
        "full_email": None,
        "category": category,
        "created_at": None
    }

    transformed_data.append(transformed_transaction)

# Write the transformed data to a new JSON file
with open(output_filename, 'w', encoding='utf-8') as file:
    json.dump(transformed_data, file, indent=4, ensure_ascii=False)

print(f"Transformation complete. Output saved to {output_filename}")
