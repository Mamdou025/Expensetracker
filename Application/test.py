from traitement import extract_transaction_data

# ✅ List of sample email texts and their corresponding received dates
email_samples = [
    ("Votre achat chez YouTube Premium Online Bonjour Mamadou, Vous avez effectué un achat de 14,94 $ auprès de YouTube Premium Online le 27ème janvier 2025 à 5:08AM (HNE). Si vous ne reconnaissez pas cette opération, connectez-vous à votre compte pour bloquer votre carte et contactez-nous..", "Mon, 05 Feb 2025 14:35:00 +0000","alerts@cibc.com" ),
    (" Défilez vers le bas pour le français.  Visit Capital One	Sign In A transaction was charged to your account. Re: Account ending in 6234 Hi, As requested, we’re notifying you of a transaction that was charged to your Capital One® Mastercard® account. February 04, 2025 COUCHE-TARD # 1319 $3.62 Please visit online banking to view your posted transactions and details. Thanks for choosing Capital One.", "Sun, 04 Feb 2025 19:10:00 +0000","notifications@capitalone.com"),#Capital One
    ("Bonjour Mamadou, Vous avez récemment effectué un achat de 30,20 $ à ESSO COUCHE-TARD avec votre CIBC Dividend Visa Infinite Card dont le numéro se termine par 0165. .", "Wed, 03 Feb 2025 08:00:00 +0000","notifications@neo.com"),
    ("Your purchase at Dima Shop Montreal Can Hi Mamadou, You made a purchase of $12.00 at Dima Shop Montreal Can on December 5th, 2024 at 5:01PM (EST). If this wasn't you, log in to freeze your card and contact us.", "Thu, 01 Feb 2025 12:25:30 +0000","notifications@capitalone.com"),
    ("A purchase of $51.66 from UBER CANADA/UBEREATS was made at 5:26 PM UTC on 2025-01-17 through your MBNA credit card ending in 4515 .", "Tue, 30 Jan 2025 16:45:10 +0000")
]

# ✅ Loop through test cases
for email_text, email_datetime , email_sender in email_samples:
    transaction_data = extract_transaction_data(email_text, email_datetime,email_sender)
    print(transaction_data)
