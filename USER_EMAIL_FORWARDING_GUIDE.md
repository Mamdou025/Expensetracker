# 📧 Email Forwarding Setup Guide for Users

## 🎯 What is Email Forwarding?

Instead of giving us your banking passwords, you simply **forward** your transaction emails to a unique address we provide. This way:
- ✅ Your banking credentials stay 100% private
- ✅ We still get your transaction emails to process
- ✅ It's automatic once set up (one-time setup)
- ✅ You maintain full control

---

## 🚀 Quick Setup (5 minutes)

### **Step 1: Get Your Unique Address**
1. Log into your ExpenseTracker account
2. Go to **Settings** → **Email Forwarding**
3. Copy your unique address: `transactions-abc123@expensetracker.com`

### **Step 2: Set Up Forwarding**
Choose your email provider below:

---

## 📮 Gmail Setup

### **Method A: Auto-Forward All Banking Emails (Recommended)**

1. **Go to Gmail Settings**
   - Click the gear icon → "See all settings"
   - Click the "Forwarding and POP/IMAP" tab

2. **Add Forwarding Address**
   - Click "Add a forwarding address"
   - Enter: `transactions-abc123@expensetracker.com`
   - Click "Next" → "Proceed"
   - We'll automatically confirm the verification email

3. **Create Filter Rule**
   - Go to Settings → "Filters and Blocked Addresses"
   - Click "Create a new filter"
   - **From:** Enter your bank emails separated by OR:
     ```
     noreply@cibc.com OR alerts@td.com OR noreply@rbc.com OR alerts@scotiabank.com OR noreply@bmo.com
     ```
   - Click "Create filter"
   - Check "Forward it to" → Select your forwarding address
   - Check "Never send it to Spam"
   - Click "Create filter"

### **Method B: Forward Specific Keywords**
- **Subject contains:** `transaction OR purchase OR payment OR debit OR credit`
- This catches transaction emails from any bank

---

## 📧 Outlook Setup

### **For Outlook.com (Web)**
1. **Go to Settings**
   - Click gear icon → "View all Outlook settings"
   - Go to "Mail" → "Forwarding"

2. **Enable Forwarding**
   - Check "Enable forwarding"
   - Enter: `transactions-abc123@expensetracker.com`
   - Click "Save"

3. **Create Rules**
   - Go to "Mail" → "Rules"
   - Click "Add new rule"
   - **Name:** "Forward Banking Emails"
   - **Condition:** "From" contains your bank domain (e.g., `cibc.com`)
   - **Action:** "Forward to" your forwarding address

### **For Outlook Desktop App**
1. **File** → **Manage Rules & Alerts**
2. **New Rule** → **Apply rule on messages I receive**
3. **From people or public group** → Add your bank emails
4. **Forward it to people or public group** → Add forwarding address

---

## 🍎 Apple Mail Setup

### **For Mac Mail App**
1. **Mail** → **Preferences** → **Rules**
2. **Add Rule**
   - **Description:** "Forward Banking Emails"
   - **If any** of the following conditions are met:
   - **From** contains `cibc.com` (add one rule per bank)
   - **Perform the following actions:**
   - **Forward Message** to `transactions-abc123@expensetracker.com`

### **For iPhone Mail**
*Note: iOS Mail doesn't support automatic forwarding. Consider using Gmail or Outlook instead.*

---

## 🏦 Bank-Specific Email Addresses

Add these to your forwarding rules:

### **Canadian Banks:**
```
CIBC: noreply@cibc.com, alerts@cibc.com
TD Canada: noreply@tdcanada.com, alerts@td.com
RBC: noreply@rbc.com, alerts@rbc.com
Scotiabank: noreply@scotiabank.com, alerts@scotiabank.com
BMO: noreply@bmo.com, alerts@bmo.com
MBNA: noreply@mbna.ca, customerservice@mbna.ca
Capital One: noreply@capitalone.ca, alerts@capitalone.ca
```

### **US Banks (if applicable):**
```
Chase: no-reply@chase.com, alerts@chase.com
Bank of America: noreply@bankofamerica.com
Wells Fargo: noreply@wellsfargo.com
Citi: no-reply@citi.com
```

---

## ✅ Testing Your Setup

### **Send a Test Email**
1. Forward an old transaction email to your forwarding address
2. Check your ExpenseTracker dashboard in a few minutes
3. You should see the transaction appear automatically

### **Verify It's Working**
- Make a small purchase (like coffee)
- Wait for the bank's transaction email
- Check if it appears in your ExpenseTracker within 5 minutes

---

## 🔧 Troubleshooting

### **"My transactions aren't showing up"**
1. **Check your forwarding rules:**
   - Make sure the bank email addresses are correct
   - Verify the forwarding address is exactly right

2. **Check spam folders:**
   - Your bank emails might be going to spam
   - Add your bank to your contacts

3. **Test with a manual forward:**
   - Forward an old transaction email manually
   - This helps identify if the issue is with forwarding or processing

### **"I'm getting too many emails forwarded"**
- Make your filter more specific
- Use **Subject contains** `transaction OR purchase` instead of forwarding all emails from the bank

### **"Gmail verification email not working"**
- Check if we received it (we auto-confirm)
- Try the verification again
- Contact support if it keeps failing

---

## 🛡️ Security & Privacy

### **Is This Safe?**
✅ **YES!** Here's why:
- **No passwords shared** - You're just forwarding emails
- **You control everything** - You can stop forwarding anytime
- **Bank emails are already insecure** - They contain transaction info anyway
- **We only read transaction data** - We ignore everything else
- **Data is encrypted** - All processing happens securely

### **What We See:**
- ✅ Transaction amounts and descriptions
- ✅ Merchant names and dates
- ❌ Your account numbers (we ignore them)
- ❌ Your passwords or PINs
- ❌ Personal information not related to transactions

### **Your Control:**
- **Turn off anytime** - Just disable forwarding in your email
- **Selective forwarding** - Only forward transaction emails
- **Delete data** - Request account deletion removes everything

---

## 📊 What Happens Next?

### **Automatic Processing:**
1. **Email arrives** at your forwarding address
2. **Bank detection** - We identify which bank sent it
3. **Transaction extraction** - We pull out the transaction details
4. **Smart categorization** - We automatically categorize the expense
5. **Dashboard update** - New transaction appears in your account

### **Timing:**
- **Real-time processing** - Usually within 2-5 minutes
- **Mobile notifications** - Get notified of new transactions
- **Email confirmations** - Optional daily/weekly summaries

---

## 💡 Pro Tips

### **Multiple Banks:**
- Add all your banks to the same forwarding rule
- Use OR between email addresses: `bank1.com OR bank2.com`

### **Credit Cards:**
- Include credit card emails too
- Most cards send transaction alerts

### **Family Accounts:**
- Each family member gets their own forwarding address
- Transactions automatically separate by account

### **Backup Method:**
- Keep file upload as backup for missed emails
- Perfect for statements and bulk imports

---

## 📞 Need Help?

### **Common Issues:**
- **Setup problems:** Check our troubleshooting guide
- **Missing transactions:** Verify your forwarding rules
- **Wrong categorization:** Train the AI with feedback

### **Contact Support:**
- **Email:** support@expensetracker.com
- **Live Chat:** Available in the app
- **Help Center:** Complete setup videos and guides

---

## 🎉 You're All Set!

Once configured, you'll have:
- ✅ **Automatic transaction tracking** for all your accounts
- ✅ **Real-time updates** as you spend
- ✅ **Smart categorization** and budgeting
- ✅ **Complete privacy** - no credentials shared
- ✅ **Full control** - manage everything from your dashboard

**Your financial data stays private while you get the convenience of automation!** 🚀

---

*Questions? Check our FAQ or contact support. We're here to help!*