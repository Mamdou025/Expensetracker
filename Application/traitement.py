import re
import email.utils
from datetime import datetime

def extract_transaction_data(email_text, email_datetime):
    """
    Extracts transaction details from an email.
    
    Args:
        email_text (str): The raw email body.
        email_datetime (str): The date & time when the email was received.
    
    Returns:
        dict: Extracted transaction data (amount, description, formatted date/time, full email).
    """

    # ✅ Convert email date format to "YYYY-MM-DD HH:MM:SS"
    parsed_date = email.utils.parsedate_to_datetime(email_datetime)
    formatted_date = parsed_date.strftime("%Y-%m-%d %H:%M:%S") if parsed_date else None

    # ✅ Regex to extract the amount (supports $ before or after, and , or . for decimals)
    amount_pattern = r"([\w\s-]{0,20})?(?:\$)?(\d{1,5}[,.]\d{2})(?:\$)?([\w\s-]{0,20})?"
    amount_match = re.search(amount_pattern, email_text)

    if amount_match:
        before_text = amount_match.group(1).strip() if amount_match.group(1) else ""
        amount = amount_match.group(2).replace(',', '.')  # Normalize comma to dot
        after_text = amount_match.group(3).strip() if amount_match.group(3) else ""

        # ✅ Create a general transaction description from surrounding text
        description = f"{before_text} {after_text}".strip()

    else:
        amount = None
        description = None

    return {
        "amount": amount,
        "description": description,
        "date": formatted_date.split(" ")[0] if formatted_date else None,  # Extract formatted date
        "time": formatted_date.split(" ")[1] if formatted_date else None,  # Extract formatted time
        "full_email": email_text  # Keep full email for reference
    }



