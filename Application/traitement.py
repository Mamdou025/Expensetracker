import os
import re
import yaml
import email.utils
from datetime import datetime

# ✅ Load configuration file
CONFIG_FILE = os.path.join(os.path.dirname(__file__), "config.yml")
with open(CONFIG_FILE, "r") as f:
    config = yaml.safe_load(f)

def identify_bank(email_sender, email_subject):
    print(email_subject)
    for bank, details in config["banks"].items():
        print(details["keywords"])
        if details["sender"] == email_sender:
            if any(keyword in email_subject for keyword in details["keywords"]):
                print(f"✅ Identified Bank: {bank}")
                return bank
    print(f"⚠️ Could not identify bank for sender: {email_sender}")
    print(email_subject)
    return "Unknown"

def extract_transaction_data(email_text, email_sender, email_subject, email_datetime):

    # ✅ Convert email date format to "YYYY-MM-DD HH:MM:SS"
    parsed_date = email.utils.parsedate_to_datetime(email_datetime)
    formatted_date = parsed_date.strftime("%Y-%m-%d %H:%M:%S") if parsed_date else None

    # ✅ Identify the bank using sender and subject
    bank_name = identify_bank(email_sender, email_subject)
    extracted_data = {"amount": None, "description": None, "card_type": None}

    if bank_name != "Unknown":
        try:
            # ✅ Load regex patterns dynamically from config.yml
            regex_patterns = config["banks"][bank_name]["regex"]
            
            # ✅ Apply regex to extract amount and description
            amount_match = re.search(regex_patterns["amount"], email_text)
            description_match = re.search(regex_patterns["description"], email_text)

            # ✅ Extract only the numeric amount and retain decimals
            extracted_data["amount"] = amount_match.group(1).replace(",", ".") if amount_match else None
            extracted_data["description"] = description_match.group(1).strip() if description_match else None
            extracted_data["card_type"] = "credit card" if "credit" in bank_name else "debit card"

            print("✅ Extracted Data:", extracted_data)
        except KeyError:
            print(f"⚠️ Regex patterns not found for {bank_name} in config.yml.")

    # ✅ Ensure correct order of returned data
    ordered_data = {
        "amount": extracted_data.get("amount"),
        "description": extracted_data.get("description"),
        "card type": extracted_data.get("card_type"),
        "date": formatted_date.split(" ")[0] if formatted_date else None,
        "time": formatted_date.split(" ")[1] if formatted_date else None,
        "bank": bank_name,
        "full_email": email_text,
    }
    print("ordered data ✅✅✅✅✅ " + extracted_data.get("description"))

    return ordered_data
