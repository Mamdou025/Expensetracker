import os
import re
import importlib
import email.utils
from datetime import datetime

# ✅ Path to the bank patterns folder
BANK_FOLDER = "bank_patterns"

# ✅ Define known sender addresses for each bank
BANK_SENDERS = {
    "mailbox.noreply@cibc.com": "cibc_debit",  # Example for CIBC Debit Card
    "notifications@capitalone.com": "capital_one",
    "alerts@mbna.ca": "mbna_amazon",
    "notifications@neo.com": "neo_credit",
    # Add more senders as needed...
}

def identify_bank(email_sender):
    """
    Identifies the bank based on the sender's email address.

    Args:
        email_sender (str): The sender's email address.

    Returns:
        str: Bank module name or "Unknown"
    """
    bank_name = BANK_SENDERS.get(email_sender, "Unknown")
    print(f"🔍 Identified Bank: {bank_name}")  # Debugging output
    if bank_name == "Unknown":
        print(f"⚠️ Sender {email_sender} not found in BANK_SENDERS!")
    return bank_name

def extract_transaction_data(email_text, email_sender, email_datetime):
    """
    Extracts transaction details from an email using bank-specific modules.

    Args:
        email_text (str): The raw email body.
        email_sender (str): The email sender address.
        email_datetime (str): The date & time when the email was received.

    Returns:
        dict: Extracted transaction data in the required order.
    """

    # ✅ Convert email date format to "YYYY-MM-DD HH:MM:SS"
    parsed_date = email.utils.parsedate_to_datetime(email_datetime)
    formatted_date = parsed_date.strftime("%Y-%m-%d %H:%M:%S") if parsed_date else None

    # ✅ Identify the bank using the sender email
    bank_name = identify_bank(email_sender)

    # ✅ Debugging output to check if the bank is detected
    if bank_name == "Unknown":
        print(f"⚠️ Could not identify bank for sender: {email_sender}")
    
    extracted_data = {"amount": None, "description": None, "card_type": None}

    if bank_name != "Unknown":
        try:
            # ✅ Dynamically load the bank module
            bank_module = importlib.import_module(f"{BANK_FOLDER}.{bank_name}")
            print(f"✅ Loaded Bank Module: {bank_name}")  # Debugging output
            extracted_data = bank_module.extract_data(email_text) or extracted_data
            print("Donnees extraites : ", extracted_data)
        except ModuleNotFoundError:
            print(f"⚠️ Bank module {bank_name} not found.")  # Debugging output

    # ✅ Ensure correct order of returned data
    ordered_data = {
        "amount": extracted_data.get("amount"),
        "description": extracted_data.get("description"),
       "card type":extracted_data.get("card_type"),
        "date": formatted_date.split(" ")[0] if formatted_date else None,
        "time": formatted_date.split(" ")[1] if formatted_date else None,
        "bank": bank_name,
        "full_email": email_text,
    }



    return ordered_data
