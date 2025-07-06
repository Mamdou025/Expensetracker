import imaplib
import email
import yaml
import os
from bs4 import BeautifulSoup
from email.header import decode_header
from datetime import datetime, date

# ✅ Configuration for date range extraction
SENDER_EMAIL = "mailbox.noreply@cibc.com"
START_DATE = "09-Feb-2025"  # Format: DD-Mon-YYYY
END_DATE = "28-jun-2025"    # Format: DD-Mon-YYYY

def load_config():
    """Load the configuration file to get bank keywords."""
    config_file = os.path.join(os.path.dirname(__file__), "config.yml")
    with open(config_file, "r", encoding='utf-8') as f:
        return yaml.safe_load(f)

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

def is_transaction_email(sender, subject, config):
    """Check if an email is a transaction based on sender and subject keywords."""
    # Find matching bank configuration
    for bank_name, bank_config in config["banks"].items():
        if bank_config["sender"].lower() == sender.lower():
            # Check if any keyword matches the subject
            keywords = bank_config["keywords"]
            for keyword in keywords:
                if keyword.lower() in subject.lower():
                    return True, bank_name, keyword
    
    return False, None, None

def fetch_emails_by_date_range():
    """Fetches all emails from a sender within a specific date range and categorizes them."""
    imap_url = 'imap.gmail.com'
    my_mail = imaplib.IMAP4_SSL(imap_url)

    # ✅ Get credentials
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    credentials_path = os.path.join(base_dir, "credentials.yml")

    user = os.getenv("EMAIL_USER")
    password = os.getenv("EMAIL_PASS")

    if os.path.exists(credentials_path):
        with open(credentials_path) as f:
            my_credentials = yaml.safe_load(f)
            user = user or my_credentials.get("user")
            password = password or my_credentials.get("password")

    if not user or not password:
        raise ValueError("Email credentials not provided. Set EMAIL_USER and EMAIL_PASS environment variables or update credentials.yml")

    # ✅ Load configuration for keyword matching
    config = load_config()

    # ✅ Login & Select Inbox
    my_mail.login(user, password)
    my_mail.select('Inbox')

    print(f"🔍 Searching for emails from {SENDER_EMAIL} between {START_DATE} and {END_DATE}")
    
    # ✅ Build IMAP search query for date range and sender
    search_criteria = f'(FROM "{SENDER_EMAIL}" SINCE "{START_DATE}" BEFORE "{END_DATE}")'
    _, data = my_mail.search(None, search_criteria)
    mail_id_list = data[0].split()

    if not mail_id_list:
        print(f"⚠️ No emails found from {SENDER_EMAIL} in the specified date range")
        return [], []

    print(f"📧 Found {len(mail_id_list)} emails in the date range")
    
    transaction_emails = []
    non_transaction_emails = []
    
    # ✅ Fetch all emails in the date range
    for i, email_id in enumerate(mail_id_list):
        try:
            _, data = my_mail.fetch(email_id, '(RFC822)')
            
            for response_part in data:
                if isinstance(response_part, tuple):
                    my_msg = email.message_from_bytes(response_part[1])
                    
                    # Decode the subject with better error handling
                    raw_subject = my_msg["Subject"]
                    if raw_subject:
                        try:
                            decoded_subject, encoding = decode_header(raw_subject)[0]
                            if isinstance(decoded_subject, bytes):
                                # Handle case where encoding is None
                                if encoding is None:
                                    # Try common encodings
                                    for enc in ['utf-8', 'iso-8859-1', 'windows-1252']:
                                        try:
                                            subject = decoded_subject.decode(enc)
                                            break
                                        except UnicodeDecodeError:
                                            continue
                                    else:
                                        # If all fail, decode with errors='ignore'
                                        subject = decoded_subject.decode('utf-8', errors='ignore')
                                else:
                                    subject = decoded_subject.decode(encoding)
                            else:
                                subject = decoded_subject
                        except Exception as e:
                            print(f"⚠️ Subject decoding error for email {email_id}: {e}")
                            subject = raw_subject  # Use raw subject as fallback
                    else:
                        subject = "No Subject"
                    
                    # Extract email content and metadata
                    email_text = extract_email_body(my_msg)
                    email_datetime = my_msg["Date"]
                    
                    # Check if this is a transaction email
                    is_transaction, bank_name, matched_keyword = is_transaction_email(SENDER_EMAIL, subject, config)
                    
                    # Store email data
                    email_data = {
                        'content': email_text,
                        'datetime': email_datetime,
                        'subject': subject,
                        'sender': SENDER_EMAIL,
                        'email_id': email_id.decode() if isinstance(email_id, bytes) else email_id,
                        'is_transaction': is_transaction,
                        'bank_name': bank_name,
                        'matched_keyword': matched_keyword
                    }
                    
                    # Categorize the email
                    if is_transaction:
                        transaction_emails.append(email_data)
                        print(f"✅ TRANSACTION {len(transaction_emails)}: {subject[:60]}... (Keyword: '{matched_keyword}')")
                    else:
                        non_transaction_emails.append(email_data)
                        print(f"📋 NON-TRANSACTION {len(non_transaction_emails)}: {subject[:60]}...")
                    
        except Exception as e:
            print(f"❌ Error extracting email {email_id}: {e}")
            continue
    
    # ✅ Close connection
    my_mail.close()
    my_mail.logout()
    
    return transaction_emails, non_transaction_emails

def display_categorized_emails(transaction_emails, non_transaction_emails):
    """Display all emails categorized by transaction status - summary with dates."""
    total_emails = len(transaction_emails) + len(non_transaction_emails)
    
    print(f"\n{'='*80}")
    print(f"📊 EMAIL ANALYSIS SUMMARY")
    print(f"📅 Date Range: {START_DATE} to {END_DATE}")
    print(f"📧 Sender: {SENDER_EMAIL}")
    print(f"{'='*80}")
    print(f"📈 Total Emails Found: {total_emails}")
    print(f"💳 Transaction Emails: {len(transaction_emails)}")
    print(f"📋 Non-Transaction Emails: {len(non_transaction_emails)}")
    print(f"{'='*80}\n")
    
    # Display transaction emails - keywords and dates
    if transaction_emails:
        print(f"💳 TRANSACTION EMAILS ({len(transaction_emails)}):")
        print("-" * 60)
        for i, email_data in enumerate(transaction_emails, 1):
            print(f"{i}. 📅 {email_data['datetime']}")
            print(f"   📧 {email_data['subject'][:50]}...")
            print(f"   🔑 Matched Keyword: '{email_data['matched_keyword']}'")
            print()
    
    # Display non-transaction emails - subjects and dates
    if non_transaction_emails:
        print(f"📋 NON-TRANSACTION EMAILS ({len(non_transaction_emails)}):")
        print("-" * 60)
        for i, email_data in enumerate(non_transaction_emails, 1):
            print(f"{i}. 📅 {email_data['datetime']}")
            print(f"   📧 {email_data['subject']}")
            print()

def save_transaction_emails_only(transaction_emails, filename="transaction_emails.txt"):
    """Save only the transaction emails to a file."""
    if not transaction_emails:
        print("No transaction emails to save.")
        return
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"TRANSACTION EMAILS FROM {SENDER_EMAIL}\n")
        f.write(f"Date Range: {START_DATE} to {END_DATE}\n")
        f.write(f"Total Transaction Emails: {len(transaction_emails)}\n")
        f.write("="*60 + "\n\n")
        
        for i, email_data in enumerate(transaction_emails, 1):
            f.write(f"--- TRANSACTION EMAIL {i} ---\n")
            f.write(f"Date: {email_data['datetime']}\n")
            f.write(f"Subject: {email_data['subject']}\n")
            f.write(f"Bank: {email_data['bank_name']}\n")
            f.write(f"Matched Keyword: {email_data['matched_keyword']}\n")
            f.write(f"Sender: {email_data['sender']}\n")
            f.write("Content:\n")
            f.write(email_data['content'])
            f.write("\n" + "="*50 + "\n\n")
    
    print(f"✅ Transaction emails saved to {filename}")

if __name__ == "__main__":
    # Load config to show what keywords we're looking for
    config = load_config()
    
    print(f"🔍 Looking for Neo Financial transaction emails with these keywords:")
    if "neo_credit" in config["banks"]:
        keywords = config["banks"]["neo_credit"]["keywords"]
        for keyword in keywords:
            print(f"   • '{keyword}'")
    print()
    
    # Fetch and categorize all emails
    transaction_emails, non_transaction_emails = fetch_emails_by_date_range()
    
    if transaction_emails or non_transaction_emails:
        # Display categorized results
        display_categorized_emails(transaction_emails, non_transaction_emails)
        
        # Optionally save transaction emails only
        if transaction_emails:
            save_choice = input("Do you want to save ONLY transaction emails to a file? (y/n): ")
            if save_choice.lower() == 'y':
                save_transaction_emails_only(transaction_emails)
    else:
        print("❌ No emails found in the specified date range.")