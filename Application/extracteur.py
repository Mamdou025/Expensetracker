import imaplib
import email
import yaml
from bs4 import BeautifulSoup  # For stripping HTML

def extract_email_body(my_msg):
    """Extracts the clean text from an email body (either plain text or HTML)."""
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
    """Fetches the most recent email from the specified sender and returns its text + received datetime."""
    imap_url = 'imap.gmail.com'
    my_mail = imaplib.IMAP4_SSL(imap_url)

    # Load credentials from YAML
    with open("credentials.yml") as f:
        my_credentials = yaml.load(f, Loader=yaml.FullLoader)
    user, password = my_credentials["user"], my_credentials["password"]

    # Login & Select Inbox
    my_mail.login(user, password)
    my_mail.select('Inbox')

    # Search for emails from a specific sender
    key = 'FROM'
    value = 'noreply@mbna.ca'
    _, data = my_mail.search(None, key, value)

    mail_id_list = data[0].split()

    # ✅ Fetch the most recent email
    if mail_id_list:
        last_email_id = mail_id_list[-1]  # Get the last email ID
        _, data = my_mail.fetch(last_email_id, '(RFC822)')

        for response_part in data:
            if isinstance(response_part, tuple):
                my_msg = email.message_from_bytes(response_part[1])
                
                email_text = extract_email_body(my_msg)  # Extract email body
                email_datetime = my_msg["Date"]  # ✅ Get the received date & time

                # ✅ Return both email text and datetime
                return email_text, email_datetime

    return None, None  # If no email found



