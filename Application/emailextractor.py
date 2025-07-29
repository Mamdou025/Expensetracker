import imaplib
import email
import yaml
import os
from bs4 import BeautifulSoup
from email.header import decode_header
from datetime import datetime
import re
import json

# ✅ Configuration for date range extraction
START_DATE = "09-Feb-2025"  # Format: DD-Mon-YYYY
END_DATE = "31-Dec-2025"    # Format: DD-Mon-YYYY

def load_config():
    """Load the configuration file to get all bank configurations."""
    config_file = os.path.join(os.path.dirname(__file__), "config.yml")
    with open(config_file, "r", encoding='utf-8') as f:
        return yaml.safe_load(f)

def sanitize_filename(filename):
    """Sanitize filename to be safe for all operating systems."""
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    filename = re.sub(r'_+', '_', filename)
    filename = filename.strip('_.')
    if len(filename) > 100:
        filename = filename[:97] + "..."
    return filename

def extract_email_content(msg):
    """Safely extract both text and HTML content from email."""
    try:
        body_text = None
        body_html = None
        
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition", ""))

                if "attachment" in content_disposition:
                    continue

                try:
                    payload = part.get_payload(decode=True)
                    if payload:
                        content = payload.decode("utf-8", errors="ignore")
                        
                        if content_type == "text/plain" and not body_text:
                            body_text = content
                        elif content_type == "text/html" and not body_html:
                            body_html = content
                except Exception:
                    continue
        else:
            # Single part message
            try:
                payload = msg.get_payload(decode=True)
                if payload:
                    content = payload.decode("utf-8", errors="ignore")
                    content_type = msg.get_content_type()
                    
                    if content_type == "text/plain":
                        body_text = content
                    elif content_type == "text/html":
                        body_html = content
            except Exception:
                pass

        # If we have HTML but no text, extract text from HTML
        if body_html and not body_text:
            try:
                soup = BeautifulSoup(body_html, "html.parser")
                body_text = soup.get_text(separator="\n")
            except Exception:
                body_text = "Could not extract text from HTML"

        return body_text or "No content found", body_html
        
    except Exception as e:
        return f"Error extracting content: {str(e)}", None

def decode_email_subject(msg):
    """Safely decode email subject."""
    try:
        raw_subject = msg.get("Subject", "")
        if not raw_subject:
            return "No Subject"
        
        decoded_parts = decode_header(raw_subject)
        subject_parts = []
        
        for part, encoding in decoded_parts:
            if isinstance(part, bytes):
                if encoding:
                    try:
                        subject_parts.append(part.decode(encoding))
                    except (UnicodeDecodeError, LookupError):
                        subject_parts.append(part.decode('utf-8', errors='ignore'))
                else:
                    subject_parts.append(part.decode('utf-8', errors='ignore'))
            else:
                subject_parts.append(part)
        
        return ''.join(subject_parts) or "No Subject"
        
    except Exception as e:
        return f"Subject decode error: {str(e)}"

def is_transaction_email(sender, subject, content, config):
    """Check if email is a transaction based on sender and keywords.

    Any phrase defined in ``exclude_keywords`` for the bank will cause the
    function to immediately return ``False`` when found in the subject or body.
    """
    try:
        for bank_name, bank_config in config["banks"].items():
            if bank_config["sender"].lower() == sender.lower():
                for ex_kw in bank_config.get("exclude_keywords", []):
                    if ex_kw.lower() in subject.lower() or ex_kw.lower() in content.lower():
                        return False, None, None

                keywords = bank_config["keywords"]
                for keyword in keywords:
                    if (keyword.lower() in subject.lower() or
                        keyword.lower() in content.lower()):
                        return True, bank_name, keyword
                return False, None, None

        return False, None, None
    except Exception:
        return False, None, None

def create_html_file(email_info, output_dir, index):
    """Create an HTML file for a transaction email."""
    try:
        # Create safe filename
        safe_subject = sanitize_filename(email_info['subject'])
        filename = f"{index:04d}_{email_info['bank_name']}_{safe_subject}.html"
        filepath = os.path.join(output_dir, filename)
        
        # Create HTML content focused on transaction details
        html_content = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💳 Transaction: {email_info['subject']}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            background: #f8f9fa;
        }}
        .email-header {{
            background: white;
            color: #333;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 25px;
            box-shadow: 0 6px 12px rgba(33, 150, 243, 0.3);
            border: 3px solid #2196F3;
        }}
        .email-header h1 {{
            margin: 0 0 15px 0;
            font-size: 26px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #2196F3;
        }}
        .transaction-icon {{
            font-size: 32px;
        }}
        .metadata {{
            display: grid;
            grid-template-columns: 150px 1fr;
            gap: 12px;
            font-size: 15px;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #e3f2fd;
        }}
        .metadata strong {{
            color: #1976d2;
            font-weight: 600;
        }}
        .content {{
            border: 2px solid #2196F3;
            padding: 30px;
            border-radius: 12px;
            background: white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }}
        .transaction-badge {{
            background: #2196F3;
            color: white;
            padding: 8px 16px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: bold;
            display: inline-block;
            box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
        }}
        .bank-tag {{
            background: #1976d2;
            color: white;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
        }}
        .original-content {{
            background: white;
            border: 2px solid #2196F3;
            border-radius: 8px;
            padding: 25px;
            margin-top: 20px;
            border-left: 5px solid #2196F3;
        }}
        .keyword-highlight {{
            background: #e3f2fd;
            color: #1976d2;
            padding: 3px 8px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 13px;
            border: 1px solid #2196F3;
        }}
    </style>
</head>
<body>
    <div class="email-header">
        <h1><span class="transaction-icon">💳</span> COURRIEL DE TRANSACTION</h1>
        <div class="metadata">
            <strong>Banque:</strong> 
            <span>{email_info['sender']} <span class="bank-tag">{email_info['bank_name'].upper()}</span></span>
            
            <strong>Date:</strong> 
            <span>{email_info['datetime']}</span>
            
            <strong>Sujet:</strong> 
            <span>{email_info['subject']}</span>
            
            <strong>Classification:</strong> 
            <span class="transaction-badge">💳 TRANSACTION CONFIRMÉE</span>
            
            <strong>Mot-clé déclencheur:</strong> 
            <span class="keyword-highlight">"{email_info['matched_keyword']}"</span>
            
            <strong>ID Courriel:</strong> 
            <span>{email_info['email_id']}</span>
            
            <strong>Type de banque:</strong> 
            <span>{email_info['bank_name'].replace('_', ' ').title()}</span>
        </div>
    </div>
    
    <div class="content">
        <h3>📧 Contenu du courriel de transaction</h3>
        <div class="original-content">
            {email_info['html_content'] or f'<pre style="white-space: pre-wrap; font-family: inherit;">{email_info['content']}</pre>'}
        </div>
    </div>
</body>
</html>"""
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return filename
        
    except Exception as e:
        print(f"   ❌ Error creating HTML file: {e}")
        return f"error_{index}.html"

def create_transaction_index(output_dir, transaction_emails, config):
    """Create an index HTML file for transaction emails only."""
    try:
        index_path = os.path.join(output_dir, "index.html")
        
        # Get bank statistics
        bank_stats = {}
        for email_info in transaction_emails:
            bank = email_info['bank_name']
            if bank not in bank_stats:
                bank_stats[bank] = 0
            bank_stats[bank] += 1
        
        html_content = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💳 Index des courriels de transaction</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }}
        .header {{
            background: white;
            color: #2196F3;
            padding: 35px;
            border-radius: 15px;
            margin-bottom: 30px;
            text-align: center;
            box-shadow: 0 10px 20px rgba(33, 150, 243, 0.3);
            border: 3px solid #2196F3;
        }}
        .header h1 {{
            margin: 0 0 10px 0;
            font-size: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
        }}
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .stat-card {{
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            text-align: center;
            border: 2px solid #2196F3;
        }}
        .stat-number {{
            font-size: 36px;
            font-weight: bold;
            color: #2196F3;
        }}
        .controls {{
            background: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 25px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            border: 2px solid #e3f2fd;
        }}
        .filter-buttons {{
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }}
        .filter-btn {{
            padding: 10px 20px;
            border: 2px solid #2196F3;
            border-radius: 25px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
            font-size: 14px;
            background: white;
            color: #2196F3;
        }}
        .filter-btn.active {{
            background: #2196F3;
            color: white;
            box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
        }}
        .filter-btn:hover:not(.active) {{
            background: #e3f2fd;
        }}
        .search-box {{
            width: 100%;
            padding: 15px;
            border: 2px solid #2196F3;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }}
        .search-box:focus {{
            border-color: #1976d2;
            outline: none;
            box-shadow: 0 0 5px rgba(33, 150, 243, 0.3);
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 6px 12px rgba(0,0,0,0.1);
            border: 2px solid #2196F3;
        }}
        th {{
            background: #2196F3;
            color: white;
            padding: 18px 15px;
            text-align: left;
            font-weight: 600;
            font-size: 15px;
        }}
        td {{
            padding: 15px;
            border-bottom: 1px solid #e3f2fd;
        }}
        tr:hover {{
            background: #f3f8ff;
        }}
        .transaction-row {{
            border-left: 5px solid #2196F3;
        }}
        .bank-badge {{
            background: #1976d2;
            color: white;
            padding: 5px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
        }}
        .email-link {{
            color: #2196F3;
            text-decoration: none;
            font-weight: 600;
            padding: 8px 16px;
            border: 2px solid #2196F3;
            border-radius: 20px;
            transition: all 0.3s;
            display: inline-block;
            background: white;
        }}
        .email-link:hover {{
            background: #2196F3;
            color: white;
        }}
        .keyword-tag {{
            background: #e3f2fd;
            color: #1976d2;
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: bold;
            border: 1px solid #2196F3;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1><span>💳</span> Courriels de transaction uniquement</h1>
        <p style="margin: 0; font-size: 18px; opacity: 0.8;">Courriels de transaction filtrés de toutes les banques configurées</p>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-number">{len(transaction_emails)}</div>
            <div>Total courriels de transaction</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">{len(bank_stats)}</div>
            <div>Banques avec transactions</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">{START_DATE}</div>
            <div>Date de début</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">{END_DATE}</div>
            <div>Date de fin</div>
        </div>
    </div>
    
    <div class="controls">
        <div class="filter-buttons">
            <button class="filter-btn active" onclick="filterEmails('all')">Toutes les transactions</button>"""
        
        # Add bank filter buttons
        for bank_name in bank_stats.keys():
            bank_display = bank_name.replace('_', ' ').title()
            html_content += f"""
            <button class="filter-btn" onclick="filterEmails('{bank_name}')">{bank_display} ({bank_stats[bank_name]})</button>"""
        
        html_content += f"""
        </div>
        <input type="text" class="search-box" placeholder="Rechercher par sujet, mot-clé ou date..." onkeyup="searchEmails()" id="searchInput">
    </div>
    
    <table id="emailTable">
        <thead>
            <tr>
                <th>Banque</th>
                <th>Date</th>
                <th>Sujet</th>
                <th>Mot-clé correspondant</th>
                <th>Voir le courriel</th>
            </tr>
        </thead>
        <tbody>"""
        
        # Add transaction email rows only
        for email_info in transaction_emails:
            bank_display = email_info['bank_name'].replace('_', ' ').title()
            
            html_content += f"""
            <tr class="transaction-row" data-bank="{email_info['bank_name']}">
                <td><span class="bank-badge">{bank_display}</span></td>
                <td>{email_info['datetime']}</td>
                <td>{email_info['subject'][:70]}{'...' if len(email_info['subject']) > 70 else ''}</td>
                <td><span class="keyword-tag">"{email_info['matched_keyword']}"</span></td>
                <td><a href="{email_info['filename']}" target="_blank" class="email-link">Voir la transaction</a></td>
            </tr>"""
        
        html_content += f"""
        </tbody>
    </table>

    <script>
        function filterEmails(type) {{
            const rows = document.querySelectorAll('#emailTable tbody tr');
            const buttons = document.querySelectorAll('.filter-btn');
            
            // Update button states
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            rows.forEach(row => {{
                if (type === 'all') {{
                    row.style.display = '';
                }} else {{
                    // Bank filter
                    row.style.display = row.dataset.bank === type ? '' : 'none';
                }}
            }});
        }}
        
        function searchEmails() {{
            const input = document.getElementById('searchInput');
            const filter = input.value.toLowerCase();
            const rows = document.querySelectorAll('#emailTable tbody tr');
            
            rows.forEach(row => {{
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(filter) ? '' : 'none';
            }});
        }}
    </script>
    
    <div style="margin-top: 30px; padding: 25px; background: white; border-radius: 12px; text-align: center; box-shadow: 0 4px 8px rgba(0,0,0,0.1); border: 2px solid #e3f2fd;">
        <h3>📊 Statistiques de transaction par banque</h3>"""
        
        for bank_name, count in bank_stats.items():
            bank_display = bank_name.replace('_', ' ').title()
            html_content += f"""
        <p><strong>{bank_display}:</strong> {count} courriels de transaction</p>"""
        
        html_content += """
    </div>
</body>
</html>"""
        
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return index_path
        
    except Exception as e:
        print(f"❌ Error creating transaction index: {e}")
        return None

def process_single_email(mail, email_id, sender, bank_name, config):
    """Process a single email and check if it's a transaction."""
    try:
        # Fetch the email
        _, msg_data = mail.fetch(email_id, '(RFC822)')
        
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                # Parse the email message
                msg = email.message_from_bytes(response_part[1])
                
                # Extract basic info safely
                subject = decode_email_subject(msg)
                datetime_str = msg.get("Date", "Unknown Date")
                email_text, email_html = extract_email_content(msg)
                
                # Check if this is a transaction email
                is_transaction, matched_bank, matched_keyword = is_transaction_email(
                    sender, subject, email_text, config
                )
                
                # Only return data if it's a transaction
                if is_transaction:
                    email_info = {
                        'content': email_text,
                        'html_content': email_html,
                        'datetime': datetime_str,
                        'subject': subject,
                        'sender': sender,
                        'email_id': str(email_id),
                        'is_transaction': True,
                        'bank_name': bank_name,
                        'matched_keyword': matched_keyword
                    }
                    return email_info
                
                # Return None for non-transaction emails (they'll be ignored)
                return None
                
    except Exception as e:
        print(f"   ❌ Error processing email {email_id}: {e}")
        return None

def fetch_transaction_emails_only():
    """Fetch ONLY transaction emails from ALL banks configured in the YAML file."""
    try:
        # Get credentials
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        credentials_path = os.path.join(base_dir, "credentials.yml")

        if not os.path.exists(credentials_path):
            raise ValueError(f"credentials.yml not found at {credentials_path}")

        with open(credentials_path, 'r', encoding='utf-8') as f:
            my_credentials = yaml.safe_load(f)
            user = my_credentials.get("user")
            password = my_credentials.get("password")

        if not user or not password:
            raise ValueError("Email credentials not found in credentials.yml")

        # Load configuration
        config = load_config()

        # Create output directory
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_dir = os.path.join(script_dir, "..", "TestEmails")
        os.makedirs(output_dir, exist_ok=True)
        
        print(f"📁 Output directory: {os.path.abspath(output_dir)}")

        # Connect to email
        mail = imaplib.IMAP4_SSL('imap.gmail.com')
        mail.login(user, password)
        mail.select('Inbox')

        print(f"🔍 Recherche de courriels de TRANSACTION uniquement dans {len(config['banks'])} banques:")
        for bank_name, bank_config in config['banks'].items():
            print(f"   • {bank_name}: {bank_config['sender']}")
            print(f"     Mots-clés: {bank_config['keywords']}")
        print()

        transaction_emails = []
        global_index = 1
        
        # Process each bank
        for bank_name, bank_config in config['banks'].items():
            sender = bank_config['sender']
            
            print(f"🏦 Traitement {bank_name} ({sender})...")
            
            # Search for emails from this sender
            search_criteria = f'(FROM "{sender}" SINCE "{START_DATE}" BEFORE "{END_DATE}")'
            _, data = mail.search(None, search_criteria)
            mail_id_list = data[0].split()
            
            if not mail_id_list:
                print(f"   ⚠️ Aucun courriel trouvé de {sender}")
                continue
                
            print(f"   📧 {len(mail_id_list)} courriels trouvés, vérification des transactions...")
            
            bank_transactions = 0
            
            # Process each email from this bank
            for email_id in mail_id_list:
                email_info = process_single_email(mail, email_id, sender, bank_name, config)
                
                if email_info:  # Only process if it's a transaction
                    # Create HTML file
                    filename = create_html_file(email_info, output_dir, global_index)
                    email_info['filename'] = filename
                    
                    transaction_emails.append(email_info)
                    bank_transactions += 1
                    
                    print(f"   ✅ TRANSACTION {bank_transactions}: {email_info['subject'][:50]}... → {filename}")
                    print(f"      Mot-clé: '{email_info['matched_keyword']}'")
                    
                    global_index += 1
            
            print(f"   💳 {bank_transactions} courriels de transaction trouvés pour {bank_name}")
            print()
        
        # Close connection
        mail.close()
        mail.logout()
        
        # Create transaction-only index
        if transaction_emails:
            index_path = create_transaction_index(output_dir, transaction_emails, config)
            
            print(f"{'='*80}")
            print(f"💳 EXTRACTION DES COURRIELS DE TRANSACTION TERMINÉE")
            print(f"{'='*80}")
            print(f"📁 Répertoire de sortie: {os.path.abspath(output_dir)}")
            print(f"💳 Total des courriels de transaction: {len(transaction_emails)}")
            print(f"📋 Courriels non-transaction: IGNORÉS")
            if index_path:
                print(f"🌐 Index des transactions: {index_path}")
            print(f"{'='*80}")
            
            # Show bank breakdown
            bank_counts = {}
            for email_info in transaction_emails:
                bank = email_info['bank_name']
                bank_counts[bank] = bank_counts.get(bank, 0) + 1
            
            print(f"\n📊 Répartition des transactions par banque:")
            for bank, count in bank_counts.items():
                print(f"   {bank.replace('_', ' ').title()}: {count} transactions")
        else:
            print(f"\n⚠️ Aucun courriel de transaction trouvé dans les banques configurées")
        
        return transaction_emails
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        return []

if __name__ == "__main__":
    config = load_config()
    
    print(f"💳 EXTRACTEUR DE COURRIELS DE TRANSACTION")
    print(f"=" * 50)
    print(f"📅 Période: {START_DATE} à {END_DATE}")
    print(f"🏦 Banques à traiter: {len(config['banks'])}")
    print(f"🎯 Mode: COURRIELS DE TRANSACTION UNIQUEMENT")
    print(f"=" * 50)
    
    transaction_emails = fetch_transaction_emails_only()
    if transaction_emails:
        print(f"\n🎉 Extraction des transactions terminée avec succès!")
        print(f"📄 Ouvrir TestEmails/index.html pour parcourir {len(transaction_emails)} courriels de transaction")
    else:
        print(f"\n⚠️ Aucun courriel de transaction trouvé")