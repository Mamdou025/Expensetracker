"""Email extraction utilities for transaction parsing.

This module provides two helper functions:

``fetch_emails`` retrieves raw HTML messages from all banks defined in
``config.yml`` within a date range and returns their metadata.  The
legacy ``fetch_email_text`` remains available and simply returns the
plain-text body of the first email found using ``fetch_emails``.
"""

import imaplib
import email
import yaml
import os
from bs4 import BeautifulSoup
from email.header import decode_header
from datetime import datetime

# ✅ Définissez ici l'expéditeur et la position de l'e-mail à extraire
SENDER_EMAIL = "info@neofinancial.com"  # Modifiez cette valeur selon l'expéditeur souhaité
EMAIL_POSITION = -3  # -1 pour le dernier email, -2 pour l'avant-dernier, etc.

def extract_email_body(my_msg):
    """Extracts clean text from an email body (either plain text or HTML)."""
    body = None
    for part in my_msg.walk():
        content_type = part.get_content_type()
        content_disposition = str(part.get("Content-Disposition"))

        # Ignore attachments
        if "attachment" in content_disposition:
            continue

        if content_type == "text/plain":
            body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
        elif content_type == "text/html" and not body:
            html_content = part.get_payload(decode=True).decode("utf-8", errors="ignore")
            body = BeautifulSoup(html_content, "html.parser").get_text(separator="\n")

    return body if body else "No body content found"

def fetch_emails(start_date: str, end_date: str):
    """Retrieve HTML emails from all configured banks within a date range.

    Parameters
    ----------
    start_date : str
        The earliest date to search, formatted as ``DD-Mon-YYYY``.
    end_date : str
        The latest date to include, formatted as ``DD-Mon-YYYY``.

    Returns
    -------
    list[dict]
        A list containing one dictionary per email with HTML content and
        metadata. Each dictionary has the keys ``full_email_html``,
        ``email_datetime``, ``subject``, ``sender`` and ``bank_config``.
    """

    imap_url = "imap.gmail.com"
    mail = imaplib.IMAP4_SSL(imap_url)

    # Load credentials
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    credentials_path = os.path.join(base_dir, "credentials.yml")

    user = os.getenv("EMAIL_USER")
    password = os.getenv("EMAIL_PASS")

    if os.path.exists(credentials_path):
        with open(credentials_path, "r", encoding="utf-8") as f:
            creds = yaml.safe_load(f)
            user = user or creds.get("user")
            password = password or creds.get("password")

    if not user or not password:
        raise ValueError(
            "Email credentials not provided. Set EMAIL_USER and EMAIL_PASS "
            "environment variables or update credentials.yml"
        )

    # Login and select inbox
    mail.login(user, password)
    mail.select("Inbox")

    # Load bank configuration
    config_file = os.path.join(os.path.dirname(__file__), "config.yml")
    with open(config_file, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    fetched_emails = []

    for bank_name, bank_cfg in config.get("banks", {}).items():
        sender = bank_cfg.get("sender")
        if not sender:
            continue

        search = f'(FROM "{sender}" SINCE "{start_date}" BEFORE "{end_date}")'
        _, data = mail.search(None, search)
        mail_ids = data[0].split()

        for email_id in mail_ids:
            _, msg_data = mail.fetch(email_id, "(RFC822)")
            for resp in msg_data:
                if not isinstance(resp, tuple):
                    continue
                msg = email.message_from_bytes(resp[1])

                raw_subject = msg.get("Subject", "")
                decoded_subject, encoding = decode_header(raw_subject)[0]
                if isinstance(decoded_subject, bytes):
                    subject = decoded_subject.decode(
                        encoding or "utf-8", errors="ignore"
                    )
                else:
                    subject = decoded_subject

                html_content = None
                for part in msg.walk():
                    ctype = part.get_content_type()
                    if ctype == "text/html":
                        payload = part.get_payload(decode=True)
                        if payload:
                            html_content = payload.decode(
                                "utf-8", errors="ignore"
                            )
                        break

                if html_content is None:
                    # fall back to plain text
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            payload = part.get_payload(decode=True)
                            if payload:
                                html_content = (
                                    "<pre>"
                                    + payload.decode("utf-8", errors="ignore")
                                    + "</pre>"
                                )
                            break

                fetched_emails.append(
                    {
                        "full_email_html": html_content or "",
                        "email_datetime": msg.get("Date"),
                        "subject": subject,
                        "sender": sender,
                        "bank_config": bank_name,
                    }
                )

    mail.close()
    mail.logout()

    return fetched_emails


def fetch_email_text(start_date: str | None = None, end_date: str | None = None):
    """Backwards compatible helper returning the first email's plain text.

    Parameters are optional. If not provided, ``start_date`` defaults to a very
    early date and ``end_date`` defaults to today.
    """

    if start_date is None:
        start_date = "01-Jan-1970"
    if end_date is None:
        end_date = datetime.utcnow().strftime("%d-%b-%Y")

    emails = fetch_emails(start_date, end_date)

    if not emails:
        return None

    first = emails[0]
    soup = BeautifulSoup(first["full_email_html"], "html.parser")
    text = soup.get_text(separator="\n") if first["full_email_html"] else ""

    return text, first["email_datetime"], first["subject"], first["sender"]

if __name__ == "__main__":
    email_data = fetch_email_text()
    if email_data:
        print("\n================== Extracted Email ==================")
        print(f"Date: {email_data[1]}")
        print(f"Subject: {email_data[2]}")
        print(f"Sender: {email_data[3]}")
        print("Content:")
        print(email_data[0])
        print("===================================================\n")
