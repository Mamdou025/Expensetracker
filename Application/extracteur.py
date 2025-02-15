import imaplib
import email
import yaml
import os
from bs4 import BeautifulSoup
from email.header import decode_header

# ✅ Définissez ici l'expéditeur et la position de l'e-mail à extraire
SENDER_EMAIL = "noreply@mbna.ca"  # Modifiez cette valeur selon l'expéditeur souhaité
EMAIL_POSITION = -2  # -1 pour le dernier email, -2 pour l'avant-dernier, etc.

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

def fetch_email_text():
    """Fetches a specific email from a predefined sender based on position."""
    imap_url = 'imap.gmail.com'
    my_mail = imaplib.IMAP4_SSL(imap_url)

    # ✅ Get the absolute path to 'credentials.yml'
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    credentials_path = os.path.join(base_dir, "credentials.yml")
    with open(credentials_path) as f:
        my_credentials = yaml.load(f, Loader=yaml.FullLoader)
    
    user, password = my_credentials["user"], my_credentials["password"]

    # ✅ Login & Select Inbox
    my_mail.login(user, password)
    my_mail.select('Inbox')

    print(f"🔍 Searching for email at position {EMAIL_POSITION} from: {SENDER_EMAIL}")
    _, data = my_mail.search(None, 'FROM', SENDER_EMAIL)
    mail_id_list = data[0].split()

    if not mail_id_list:
        print(f"⚠️ No emails found from {SENDER_EMAIL}")
        return None

    # ✅ Fetch the email at the chosen position
    if abs(EMAIL_POSITION) > len(mail_id_list):
        print(f"⚠️ Not enough emails available. Using the oldest email instead.")
        email_id = mail_id_list[0]  # Fallback to the oldest email
    else:
        email_id = mail_id_list[EMAIL_POSITION]  # Fetch the specified email

    _, data = my_mail.fetch(email_id, '(RFC822)')

    for response_part in data:
        if isinstance(response_part, tuple):
            my_msg = email.message_from_bytes(response_part[1])
            # Decode the subject if it's MIME-encoded
            raw_subject = my_msg["Subject"]
            decoded_subject, encoding = decode_header(raw_subject)[0]
            subject = decoded_subject.decode(encoding) if isinstance(decoded_subject, bytes) else decoded_subject
            email_text = extract_email_body(my_msg)
            email_datetime = my_msg["Date"]
            
            # ✅ Return extracted details
            return email_text, email_datetime, subject, SENDER_EMAIL

    return None

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
