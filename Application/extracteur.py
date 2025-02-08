import imaplib
import email
import yaml
from bs4 import BeautifulSoup  # For stripping HTML

# ✅ Define allowed senders and required subject keywords
ALLOWED_SENDERS = {
    "CIBC": "mailbox.noreply@cibc.com",
}

REQUIRED_SUBJECT_KEYWORDS = {
    "MBNA": ["Transaction Alert", "Purchase Notification"],
    "CIBC": ["Visa Purchase", "Transaction Notification","Nouvel achat" , "Achat en point de vente"],
    "CapitalOne": ["Transaction Alert", "Capital One Purchase"],
    "Neo": ["Card Transaction", "Neo Purchase"],
}

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
        elif content_type == "text/html" and not body:  # Use HTML if no plain text
            html_content = part.get_payload(decode=True).decode("utf-8", errors="ignore")
            body = BeautifulSoup(html_content, "html.parser").get_text(separator="\n")

    return body if body else "No body content found"

def fetch_email_text():
    """Fetches the most recent email from allowed senders and validates subject."""
    imap_url = 'imap.gmail.com'
    my_mail = imaplib.IMAP4_SSL(imap_url)

    # Load credentials from YAML
    with open("credentials.yml") as f:
        my_credentials = yaml.load(f, Loader=yaml.FullLoader)
    user, password = my_credentials["user"], my_credentials["password"]

    # Login & Select Inbox
    my_mail.login(user, password)
    my_mail.select('Inbox')

    # ✅ Loop through allowed senders and check their emails
    for bank, sender in ALLOWED_SENDERS.items():
        key = 'FROM'
        value = sender
        _, data = my_mail.search(None, key, value)

        mail_id_list = data[0].split()

        # ✅ Process the most recent email from the sender
        if mail_id_list:
            last_email_id = mail_id_list[-1]  # Get the last email ID
            _, data = my_mail.fetch(last_email_id, '(RFC822)')

            for response_part in data:
                if isinstance(response_part, tuple):
                    my_msg = email.message_from_bytes(response_part[1])

                    # ✅ Extract subject and check if it contains required keywords
                    subject = my_msg["Subject"]
                    print("Sujet : "+ subject)
                    if not any(keyword in subject for keyword in REQUIRED_SUBJECT_KEYWORDS[bank]):
                        print(f"❌ Rejected email from {sender}: Subject '{subject}' does not match required keywords.")
                        continue  # Skip this email

                    # ✅ Extract email body and date-time
                    email_text = extract_email_body(my_msg)
                    email_datetime = my_msg["Date"]
                    print(email_text)

                    # ✅ Return all valid extracted data
                    return email_text, email_datetime, subject, sender

    return None, None, None, None  # If no valid email found




