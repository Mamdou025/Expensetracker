import os
import re
import yaml
import email.utils
import sqlite3
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

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


def is_duplicate(amount: str, date: str) -> bool:
    """Check if a similar transaction already exists within +/- 1 day."""
    try:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Database"))
        db_path = os.path.join(base_dir, "transactions.db")

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        dt = datetime.strptime(date, "%Y-%m-%d")
        start = (dt - timedelta(days=1)).strftime("%Y-%m-%d")
        end = (dt + timedelta(days=1)).strftime("%Y-%m-%d")

        cursor.execute(
            "SELECT COUNT(*) FROM transactions WHERE amount = ? AND date BETWEEN ? AND ?",
            (float(amount), start, end),
        )
        count = cursor.fetchone()[0]
        conn.close()
        return count > 0
    except Exception:
        return False

def extract_transaction_data(
    email_data,
    email_sender: str | None = None,
    email_subject: str | None = None,
    email_datetime: str | None = None,
    cfg: dict | None = None,
):
    """Extract transaction details from an email.

    Parameters
    ----------
    email_data : dict | str
        Either a dictionary returned by ``fetch_emails`` or the plain text body
        of an email for backward compatibility.
    email_sender : str, optional
        Sender address if ``email_data`` is not a dictionary.
    email_subject : str, optional
        Email subject if ``email_data`` is not a dictionary.
    email_datetime : str, optional
        Date header value if ``email_data`` is not a dictionary.
    cfg : dict, optional
        Configuration dictionary. Defaults to ``config`` loaded from
        ``config.yml``.
    """

    if cfg is None:
        cfg = config

    # Determine whether ``email_data`` is new-style dict or plain text
    bank_key = None
    if isinstance(email_data, dict):
        email_sender = email_data.get("sender", email_sender)
        email_subject = email_data.get("subject", email_subject)
        email_datetime = email_data.get("email_datetime", email_datetime)
        bank_key = email_data.get("bank_config")
        html = email_data.get("full_email_html", "")
        soup = BeautifulSoup(html, "html.parser")
        email_text = soup.get_text(separator="\n")
    else:
        email_text = email_data

    parsed_date = email.utils.parsedate_to_datetime(email_datetime) if email_datetime else None
    formatted_date = parsed_date.strftime("%Y-%m-%d %H:%M:%S") if parsed_date else None

    bank_name = bank_key or identify_bank(email_sender, email_subject)
    extracted_data = {"amount": None, "description": None, "card_type": None}

    if bank_name != "Unknown" and bank_name in cfg.get("banks", {}):
        try:
            regex_patterns = cfg["banks"][bank_name]["regex"]
            amount_match = re.search(regex_patterns["amount"], email_text)
            description_match = re.search(regex_patterns["description"], email_text)
            extracted_data["amount"] = (
                amount_match.group(1).replace(",", ".") if amount_match else None
            )
            extracted_data["description"] = (
                description_match.group(1).strip() if description_match else None
            )
            extracted_data["card_type"] = "credit card" if "credit" in bank_name else "debit card"
        except KeyError:
            print(f"⚠️ Regex patterns not found for {bank_name} in config.")

    ordered_data = {
        "amount": extracted_data.get("amount"),
        "description": extracted_data.get("description"),
        "card type": extracted_data.get("card_type"),
        "date": formatted_date.split(" ")[0] if formatted_date else None,
        "time": formatted_date.split(" ")[1] if formatted_date else None,
        "bank": bank_name,
        "full_email": email_text,
    }

    dup = False
    if ordered_data["amount"] and ordered_data["date"]:
        dup = is_duplicate(ordered_data["amount"], ordered_data["date"])

    ordered_data["duplicate"] = dup
    return ordered_data
