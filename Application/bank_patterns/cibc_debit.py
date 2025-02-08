import re

BANK_NAME = "CIBC Debit Card"

# ✅ Regex to match amount (Already confirmed working)
PATTERN_AMOUNT = re.compile(r"Montant de l'achat\s*:\s*(\d+[,.]\d{2})\$", re.IGNORECASE)

# ✅ New regex to match merchant name (Lieu de l'achat)
PATTERN_MERCHANT = re.compile(r"Lieu de l'achat\s*:\s*(.*?)\r?\n", re.IGNORECASE)

def extract_data(email_text):
    print("🔍 Checking email text for CIBC match...")

    # ✅ Extract Amount
    match_amount = PATTERN_AMOUNT.search(email_text)
    amount = match_amount.group(1).replace(",", ".") if match_amount else None  # Normalize comma to dot

    # ✅ Extract Merchant Name
    match_merchant = PATTERN_MERCHANT.search(email_text)
    description = match_merchant.group(1).strip() if match_merchant else None

   

    print("✅ Extracted Amount:", amount)
    print("✅ Extracted Merchant:", description)

    # ✅ Return extracted data
    return {
        "amount": amount,
        "description": description,
        "card_type": "credit card"
    }
