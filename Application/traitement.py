import os
import re
import yaml
import email.utils
import sqlite3
import logging
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

# Setup basic logging if not already configured
if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ✅ Load configuration file
CONFIG_FILE = os.path.join(os.path.dirname(__file__), "config.yml")
with open(CONFIG_FILE, "r") as f:
    config = yaml.safe_load(f)

def identify_bank(email_sender, email_subject):
    """Identify the bank that sent the email based on sender and subject."""
    logger.debug("Subject: %s", email_subject)
    for bank, details in config["banks"].items():
        logger.debug("Checking keywords for %s: %s", bank, details["keywords"])
        if details["sender"] == email_sender:
            if any(keyword in email_subject for keyword in details["keywords"]):
                logger.info("Identified Bank: %s", bank)
                return bank
    logger.warning("Could not identify bank for sender: %s", email_sender)
    logger.debug("Subject was: %s", email_subject)
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

def _contains_exclude_keyword(bank_cfg: dict, subject: str, content: str) -> bool:
    """Return True when email subject/body contains any bank exclude keyword."""
    subject_l = (subject or "").lower()
    content_l = (content or "").lower()
    for keyword in bank_cfg.get("exclude_keywords", []):
        if keyword.lower() in subject_l or keyword.lower() in content_l:
            return True
    return False


def _build_source_ref(email_payload: dict | None) -> str | None:
    """Create a stable source reference for ingestion tracing."""
    if not isinstance(email_payload, dict):
        return None

    explicit_ref = email_payload.get("id") or email_payload.get("source_ref")
    if explicit_ref:
        return str(explicit_ref)

    parts = [
        email_payload.get("sender"),
        email_payload.get("subject"),
        email_payload.get("email_datetime"),
    ]
    cleaned = [str(p).strip() for p in parts if p]
    return "|".join(cleaned) if cleaned else None


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
    html = ""
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

    bank_cfg = cfg.get("banks", {}).get(bank_name) if bank_name != "Unknown" else None
    if bank_cfg and _contains_exclude_keyword(bank_cfg, email_subject or "", email_text):
        bank_name = "Unknown"

    if bank_name != "Unknown" and bank_name in cfg.get("banks", {}):
        try:
            regex_patterns = cfg["banks"][bank_name]["regex"]

            amount_match = description_match = None

            if isinstance(regex_patterns, list):
                for pat in regex_patterns:
                    if not isinstance(pat, dict):
                        continue
                    a_match = re.search(pat.get("amount", ""), email_text)
                    d_match = re.search(pat.get("description", ""), email_text)
                    if a_match and d_match:
                        amount_match = a_match
                        description_match = d_match
                        break
            else:
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
            logger.error("Regex patterns not found for %s in config.", bank_name)

    ordered_data = {
        "amount": extracted_data.get("amount"),
        "description": extracted_data.get("description"),
        "card_type": extracted_data.get("card_type"),
        # Backward compatibility for old consumers still reading "card type"
        "card type": extracted_data.get("card_type"),
        "date": formatted_date.split(" ")[0] if formatted_date else None,
        "time": formatted_date.split(" ")[1] if formatted_date else None,
        "bank": bank_name,
        "full_email": html if html else email_text,
        # Explicit contract defaults
        "tags": [],
        "source_type": "email",
        "source_ref": _build_source_ref(email_data if isinstance(email_data, dict) else None),
    }

    dup = False
    if ordered_data["amount"] and ordered_data["date"]:
        dup = is_duplicate(ordered_data["amount"], ordered_data["date"])

    ordered_data["duplicate"] = dup
    return ordered_data
