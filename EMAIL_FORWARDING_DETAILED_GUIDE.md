# 📧 Email Forwarding System - Complete Technical Guide

## 🔍 How Email Forwarding Works

### **The Basic Concept**
Instead of users giving you their banking email passwords, they **forward** their transaction emails to unique addresses you provide. This way:
- ✅ Users keep their banking credentials private
- ✅ You still get access to transaction emails for processing
- ✅ Banks can't complain about credential sharing
- ✅ Users maintain full control

---

## 🏗️ Technical Architecture

### **Step 1: Generate Unique Forwarding Addresses**
```javascript
// When user registers, generate a unique forwarding email
const generateForwardingEmail = (userId) => {
    const hash = crypto.createHash('sha256')
        .update(`${userId}-${process.env.EMAIL_SALT}`)
        .digest('hex')
        .substring(0, 16);
    
    return `transactions-${hash}@yourapp.com`;
};

// Example outputs:
// User ID 1 → transactions-a1b2c3d4e5f6@yourapp.com
// User ID 2 → transactions-9x8y7z6w5v4u@yourapp.com
```

### **Step 2: Email Server Configuration**
You need to set up email receiving on your domain:

```bash
# Your domain: yourapp.com
# MX Record points to your email server
# Catch-all email routing: *@yourapp.com → your processing system
```

### **Step 3: Email Processing Pipeline**
```javascript
// Email arrives at transactions-a1b2c3d4e5f6@yourapp.com
const processIncomingEmail = async (emailData) => {
    // 1. Extract user ID from email address
    const forwardingAddress = emailData.to;
    const userId = getUserIdFromForwardingAddress(forwardingAddress);
    
    // 2. Verify email authenticity
    const verification = verifyEmailSecurity(emailData);
    if (!verification.isValid) {
        throw new Error('Email failed security checks');
    }
    
    // 3. Detect which bank sent this email
    const bankType = detectBankFromEmail(emailData);
    
    // 4. Extract transaction data
    const transactions = await extractTransactions(emailData.body, bankType);
    
    // 5. Store in user's account
    await storeTransactionsForUser(userId, transactions);
    
    // 6. Notify user (optional)
    await notifyUser(userId, `${transactions.length} new transactions processed`);
};
```

---

## 🔧 Implementation Methods

### **Method A: Dedicated Email Service** (Recommended)
Use a service like **Mailgun**, **SendGrid**, or **AWS SES**:

```javascript
// Using Mailgun's Incoming Email API
const express = require('express');
const multer = require('multer');
const upload = multer();

app.post('/webhook/mailgun', upload.none(), async (req, res) => {
    const {
        recipient,     // transactions-a1b2c3d4e5f6@yourapp.com
        sender,        // noreply@cibc.com
        subject,       // "Transaction Alert"
        'body-plain': textBody,
        'body-html': htmlBody
    } = req.body;
    
    try {
        // Process the forwarded email
        await processForwardedEmail({
            to: recipient,
            from: sender,
            subject: subject,
            body: htmlBody || textBody
        });
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Email processing failed:', error);
        res.status(500).send('Error');
    }
});
```

### **Method B: IMAP Email Checking**
Periodically check a dedicated email account:

```javascript
const Imap = require('imap');

const checkForNewEmails = () => {
    const imap = new Imap({
        user: 'transactions@yourapp.com',
        password: process.env.EMAIL_PASSWORD,
        host: 'imap.yourapp.com',
        port: 993,
        tls: true
    });
    
    imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
            if (err) throw err;
            
            // Search for unread emails
            imap.search(['UNSEEN'], (err, results) => {
                if (err) throw err;
                
                results.forEach(async (emailId) => {
                    const email = await fetchEmail(imap, emailId);
                    await processForwardedEmail(email);
                    imap.addFlags(emailId, ['\\Seen'], () => {});
                });
            });
        });
    });
    
    imap.connect();
};

// Check every 5 minutes
setInterval(checkForNewEmails, 5 * 60 * 1000);
```

---

## 👤 User Setup Process

### **What Users Need to Do (One-Time Setup)**

#### **For Gmail Users:**
1. Go to Gmail Settings → "Forwarding and POP/IMAP"
2. Click "Add a forwarding address"
3. Enter their unique address: `transactions-a1b2c3d4e5f6@yourapp.com`
4. Gmail sends verification email to that address
5. You auto-confirm it via your email processing
6. User creates a filter:
   - **From:** `noreply@cibc.com` OR `alerts@td.com` (their banks)
   - **Subject contains:** "transaction" OR "purchase" OR "payment"
   - **Action:** Forward to their unique address

#### **For Outlook Users:**
1. Go to Outlook Settings → "Mail" → "Forwarding"
2. Enable forwarding to their unique address
3. Create rules to forward only banking emails

#### **For Apple Mail Users:**
1. Mail → Preferences → Rules
2. Create rule: If sender contains bank domains → Forward to unique address

---

## 🔍 Email Processing Logic

### **Bank Detection System**
```javascript
const detectBankFromEmail = (emailData) => {
    const sender = emailData.from.toLowerCase();
    const subject = emailData.subject.toLowerCase();
    
    // Canadian banks email patterns
    const bankPatterns = {
        'cibc': [
            'noreply@cibc.com',
            'alerts@cibc.com',
            'cibc.com'
        ],
        'td': [
            'tdcanada.com',
            'alerts@td.com',
            'noreply@tdcanada.com'
        ],
        'rbc': [
            'rbc.com',
            'alerts@rbc.com'
        ],
        'scotiabank': [
            'scotiabank.com',
            'alerts@scotiabank.com'
        ],
        'bmo': [
            'bmo.com',
            'alerts@bmo.com'
        ]
    };
    
    for (const [bank, patterns] of Object.entries(bankPatterns)) {
        if (patterns.some(pattern => sender.includes(pattern))) {
            return bank;
        }
    }
    
    return 'unknown';
};
```

### **Transaction Extraction**
```javascript
const extractTransactions = async (emailBody, bankType) => {
    // Use your existing Python extraction scripts
    const pythonScript = path.join(__dirname, '../Application/extracteur.py');
    
    return new Promise((resolve, reject) => {
        const py = spawn('python', [pythonScript, bankType]);
        
        // Send email content to Python script
        py.stdin.write(emailBody);
        py.stdin.end();
        
        let output = '';
        py.stdout.on('data', (data) => output += data);
        
        py.on('close', (code) => {
            if (code === 0) {
                try {
                    const transactions = JSON.parse(output);
                    resolve(transactions);
                } catch (e) {
                    reject(new Error('Failed to parse transactions'));
                }
            } else {
                reject(new Error('Python script failed'));
            }
        });
    });
};
```

---

## 🛡️ Security Considerations

### **Email Verification**
```javascript
const verifyEmailSecurity = (emailData) => {
    // 1. Check SPF (Sender Policy Framework)
    const spfValid = checkSPF(emailData.headers);
    
    // 2. Check DKIM (Domain Keys Identified Mail)
    const dkimValid = checkDKIM(emailData.headers);
    
    // 3. Verify sender is legitimate bank
    const senderValid = isLegitimateBank(emailData.from);
    
    // 4. Check for suspicious content
    const contentSafe = !containsSuspiciousContent(emailData.body);
    
    return {
        isValid: spfValid && dkimValid && senderValid && contentSafe,
        spf: spfValid,
        dkim: dkimValid,
        sender: senderValid,
        content: contentSafe
    };
};
```

### **User Privacy Protection**
```javascript
const getUserIdFromForwardingAddress = (emailAddress) => {
    // Extract hash from email: transactions-a1b2c3d4e5f6@yourapp.com
    const match = emailAddress.match(/transactions-([a-f0-9]+)@/);
    if (!match) return null;
    
    const hash = match[1];
    
    // Look up user ID from hash (stored in database during registration)
    const user = db.prepare('SELECT user_id FROM forwarding_addresses WHERE hash = ?').get(hash);
    return user?.user_id || null;
};
```

---

## 📊 Real-World Example

### **Complete Flow:**

1. **User Registration:**
   ```
   User "john@gmail.com" registers
   → Gets forwarding address: transactions-a1b2c3d4e5f6@yourapp.com
   → Stored in database: hash "a1b2c3d4e5f6" → user_id 123
   ```

2. **User Setup:**
   ```
   John sets up Gmail forwarding:
   → Emails from *@cibc.com forward to transactions-a1b2c3d4e5f6@yourapp.com
   ```

3. **Transaction Occurs:**
   ```
   John buys coffee with CIBC card
   → CIBC sends email to john@gmail.com
   → Gmail forwards to transactions-a1b2c3d4e5f6@yourapp.com
   ```

4. **Email Processing:**
   ```
   Your server receives email
   → Extracts user_id 123 from address
   → Detects bank: CIBC
   → Extracts transaction: $4.50 at Tim Hortons
   → Stores in user 123's account
   → John sees transaction in app
   ```

---

## ⚙️ Setup Requirements

### **Domain & Email Setup:**
```bash
# 1. Purchase domain: yourapp.com
# 2. Set up MX records pointing to email service
# 3. Configure catch-all or wildcard email routing
# 4. Set up webhook endpoints for incoming emails
```

### **Email Service Options:**
- **Mailgun**: $35/month for 50K emails
- **SendGrid**: $15/month for 40K emails  
- **AWS SES**: $0.10 per 1000 emails
- **Self-hosted**: Postfix + Dovecot (complex but free)

### **Cost Estimation:**
- **Domain**: $12/year
- **Email service**: $15-35/month
- **Processing**: Minimal server resources
- **Total**: ~$20-40/month for email forwarding

---

## 🎯 Advantages vs Alternatives

### **Email Forwarding vs File Upload:**
| Feature | Email Forwarding | File Upload |
|---------|------------------|-------------|
| **Automation** | ✅ Fully automatic | ❌ Manual process |
| **Real-time** | ✅ Immediate processing | ❌ When user uploads |
| **User effort** | ✅ One-time setup | ❌ Ongoing work |
| **Technical complexity** | ❌ Email server needed | ✅ Simple file handling |
| **Reliability** | ❌ Depends on email delivery | ✅ Direct user control |

### **Why Email Forwarding is Powerful:**
- ✅ **Zero ongoing user effort** after initial setup
- ✅ **Works with all banks** regardless of API availability
- ✅ **Real-time processing** as transactions happen
- ✅ **Familiar to users** - everyone knows email forwarding
- ✅ **Scalable** - handles any volume of transactions

**Bottom Line:** Email forwarding gives you the automation benefits without the security risks of credential sharing! 🎉

Would you like me to show you how to implement any specific part of this system?