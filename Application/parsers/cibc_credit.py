import re
from datetime import datetime


FR_MONTH_MAP = {
    'JAN': 1, 'JANV': 1,
    'FEV': 2, 'FÉV': 2, 'FEVR': 2,
    'MAR': 3, 'MARS': 3,
    'AVR': 4, 'AVRI': 4,
    'MAI': 5,
    'JUN': 6, 'JUIN': 6,
    'JUL': 7, 'JUIL': 7,
    'AOU': 8, 'AOUT': 8, 'AOÛ': 8, 'AOÛT': 8,
    'SEP': 9, 'SEPT': 9,
    'OCT': 10,
    'NOV': 11,
    'DEC': 12, 'DÉC': 12,
}

CIBC_CATEGORIES = [
    'Magasins de détail et épicerie',
    'Transports',
    'Restaurants',
    'Divertissement',
    'Épicerie',
    'Services publics',
    'Voyages',
    'Services professionnels',
    'Santé',
    'Éducation',
    'Assurance',
    'Télécommunications',
]

STATEMENT_PERIOD_RE = re.compile(
    r'(\d{1,2})\s+([\wéûôàâêë]+)\s+(\d{4})\s+au\s+(\d{1,2})\s*([\wéûôàâêë]+)\s+(\d{4})',
    re.IGNORECASE,
)

CARD_NUMBER_RE = re.compile(r'(\d{4}\s+XXXX\s+XXXX\s+\d{4})')

PREVIOUS_BALANCE_RE = re.compile(
    r'Solde\s+ant[ée]rieur\s+([\d\s]+,\d{2})\s*\$'
)

TOTAL_BALANCE_RE = re.compile(
    r'Solde\s+total\s*=?\s*([\d\s]+,\d{2})\s*\$'
)

PAYMENTS_TOTAL_RE = re.compile(
    r'Total\s+des\s+paiements\s+([\d\s]+,\d{2})\s*\$'
)

INTEREST_TOTAL_RE = re.compile(
    r'Total\s+des\s+int[ée]r[êe]ts\s+pour\s+la\s+p[ée]riode\s+([\d\s]+,\d{2})\s*\$'
)

PURCHASES_TOTAL_RE = re.compile(
    r'Total\s+pour\s+\d{4}\s+XXXX\s+XXXX\s+\d{4}\s+([\d\s]+,\d{2})\s*\$'
)

CREDIT_LIMIT_RE = re.compile(
    r'Limite\s+([\d\s]+,\d{2})\s*\$'
)

MIN_PAYMENT_RE = re.compile(
    r'Paiement\s+minimum\s+total\s+exig[ée]\s*=?\s*([\d\s]+,\d{2})\s*\$'
)

DUE_DATE_RE = re.compile(
    r'verser\s+au\s+plus\s+tard\s+le\s+(\d{1,2})\s+(\w{3,4})\s+(\d{4})',
    re.IGNORECASE,
)

MONTH_ABBRS = '|'.join(sorted(FR_MONTH_MAP.keys(), key=len, reverse=True))
TX_LINE_RE = re.compile(
    r'^(?:Ý\s*)?(' + MONTH_ABBRS + r')\s+(\d{1,2})\s+(' + MONTH_ABBRS + r')\s+(\d{1,2})\s+(.+)',
    re.IGNORECASE,
)

FR_AMOUNT_RE = re.compile(
    r'(\d{1,3}(?:\s\d{3})*,\d{2})\s*\$?'
)

SKIP_LINES = [
    'Opérations',
    'Date',
    "de l'opér",
    "de l'inscr",
    'Description',
    'Montant',
    'Total des paiements',
    'Total des intérêts',
    'Total des crédits',
    'Total pour',
    'Vos paiements',
    'Vos intérêts',
    'Vos nouveaux frais',
    'Indique les opérations',
    'de remise en argent',
    'No de carte',
    'Catégories de dépenses',
    'Renseignements',
    'Page ',
    'Carte Dividendes',
    'CIBC Visa',
    'MR MAMADOU',
    'MAMADOU FALL',
    'LAVAL QC H7A',
    'AV DES TREMBLES',
    'Détachez',
    'Prière de voir',
    'Options de paiement',
    'www.cibc.com',
    'Numéro de compte',
    'Montant exigible',
    'Paiement minimum',
    'Montant versé',
    'Veuilllez',
    'Services bancaires',
    'guichet automatique',
    'institutions financières',
    'poste',
    'chèque ou mandat',
    'Pour les demandes',
    'PO BOX',
    'TORONTO ON',
    'Ý',
    '*020',
    '*000',
    '000721',
    '127000',
    'Solde antérieur',
    'Paiements',
    'Autres crédits',
    'Achats',
    'Avances en espèces',
    'Frais totaux',
    'Solde total',
    'Aperçu de votre',
    'Sommaire',
    'Limite',
    "Taux d'intérêt",
    'Annuel',
    'Votre montant',
    'Votre compte est en',
    'comprend les deux',
    'souffrance',
    'Veuillez payer',
    'Au dernier relevé',
    'Sur ce relevé',
    'remise en argent',
    'Dividendes',
    'Questions',
    'Perdues',
    'ATS :',
    'Site Web',
    'Intérêts',
    'Frais',
    '0000450',
]

TEMPLATE_META = {
    'id': 'cibc_credit',
    'bank': 'CIBC',
    'account_type': 'Visa Credit Card',
    'country': 'Canada',
    'detection_keywords': ['Carte Dividendes CIBC', 'Visa Infinite', 'CIBC'],
    'fields_extracted': [
        'statement_period', 'card_number', 'previous_balance',
        'total_balance', 'minimum_payment', 'due_date',
        'credit_limit', 'total_payments', 'total_purchases',
        'total_interest',
    ],
    'transaction_fields': ['date', 'posting_date', 'description', 'amount', 'direction'],
    'date_format': 'MON DD (French, year inferred from statement period)',
    'columns': ['Montant ($)'],
    'notes': 'French CIBC Visa credit card statement. Handles comma-decimal amounts, three transaction sections (payments, interest, purchases), CIBC spending categories, and Ý reward multiplier markers.',
}


def _parse_fr_amount(text):
    cleaned = text.replace(' ', '').replace(',', '.')
    return float(cleaned)


def _resolve_month(month_str):
    upper = month_str.upper().replace('É', 'É').replace('Û', 'Û')
    for key, val in FR_MONTH_MAP.items():
        if upper.startswith(key) or key.startswith(upper):
            return val
    return None


def _resolve_date(day, month_str, year):
    month = _resolve_month(month_str)
    if not month:
        return None
    try:
        return datetime(year, month, int(day)).strftime('%Y-%m-%d')
    except ValueError:
        return None


def _should_skip(line):
    for skip in SKIP_LINES:
        if skip in line:
            return True
    return False


def _strip_cibc_category(text):
    for cat in CIBC_CATEGORIES:
        idx = text.find(cat)
        if idx > 0:
            return text[:idx].strip(), cat
    return text, None


def _extract_amount_and_desc(rest):
    amounts = list(FR_AMOUNT_RE.finditer(rest))
    if not amounts:
        return None, rest, None

    last_amount = amounts[-1]
    amt_str = last_amount.group(1)
    before_amount = rest[:last_amount.start()].strip()

    desc, cibc_category = _strip_cibc_category(before_amount)

    if not desc:
        desc = before_amount

    interest_rate = None
    rate_match = re.search(r'(\d{1,2},\d{2})\s*%', desc)
    if rate_match:
        interest_rate = rate_match.group(1)
        desc = desc[:rate_match.start()].strip()

    return _parse_fr_amount(amt_str), desc, cibc_category


def metadata():
    return TEMPLATE_META


def detect(full_text):
    lower = full_text.lower()
    return (
        'cibc' in lower
        and ('carte dividendes' in lower or 'visa infinite' in lower or 'visa' in lower)
        and ('montant ($)' in lower or "de l'opér" in lower or "de l'inscr" in lower)
        and 'solde ant' in lower
    )


def parse(pages_text, document_id=None, filepath=None):
    full_text = '\n'.join(pages_text)

    period_match = STATEMENT_PERIOD_RE.search(full_text)
    if not period_match:
        return None

    start_day = period_match.group(1)
    start_month_str = period_match.group(2)
    start_year = int(period_match.group(3))
    end_day = period_match.group(4)
    end_month_str = period_match.group(5)
    end_year = int(period_match.group(6))

    period_start = _resolve_date(start_day, start_month_str, start_year)
    period_end = _resolve_date(end_day, end_month_str, end_year)
    end_month_num = _resolve_month(end_month_str) or 12

    card_match = CARD_NUMBER_RE.search(full_text)
    card_number = card_match.group(1) if card_match else None

    prev_match = PREVIOUS_BALANCE_RE.search(full_text)
    previous_balance = _parse_fr_amount(prev_match.group(1)) if prev_match else None

    total_match = TOTAL_BALANCE_RE.search(full_text)
    total_balance = _parse_fr_amount(total_match.group(1)) if total_match else None

    payments_match = PAYMENTS_TOTAL_RE.search(full_text)
    total_payments = _parse_fr_amount(payments_match.group(1)) if payments_match else None

    interest_match = INTEREST_TOTAL_RE.search(full_text)
    total_interest = _parse_fr_amount(interest_match.group(1)) if interest_match else None

    purchases_match = PURCHASES_TOTAL_RE.search(full_text)
    total_purchases = _parse_fr_amount(purchases_match.group(1)) if purchases_match else None

    credit_match = CREDIT_LIMIT_RE.search(full_text)
    credit_limit = _parse_fr_amount(credit_match.group(1)) if credit_match else None

    min_pay_match = MIN_PAYMENT_RE.search(full_text)
    minimum_payment = _parse_fr_amount(min_pay_match.group(1)) if min_pay_match else None

    due_match = DUE_DATE_RE.search(full_text)
    due_date = None
    if due_match:
        due_date = _resolve_date(due_match.group(1), due_match.group(2), int(due_match.group(3)))

    all_lines = []
    for page_text in pages_text:
        for line in page_text.split('\n'):
            all_lines.append(line.strip())

    transactions = []
    current_section = None

    for line in all_lines:
        if not line or len(line) < 5:
            continue

        if 'Vos paiements' in line:
            current_section = 'payments'
            continue
        elif 'Vos intérêts' in line:
            current_section = 'interest'
            continue
        elif 'Vos nouveaux frais et crédits' in line:
            current_section = 'purchases'
            continue
        elif 'Renseignements sur votre compte' in line:
            current_section = None
            continue
        elif 'Votre centre de message' in line:
            current_section = None
            continue

        if current_section is None:
            continue

        if _should_skip(line):
            continue

        clean_line = re.sub(r'^Ý\s*', '', line).strip()
        if not clean_line:
            continue

        tx_match = TX_LINE_RE.match(line)
        if not tx_match:
            continue

        op_month = tx_match.group(1)
        op_day = tx_match.group(2)
        post_month = tx_match.group(3)
        post_day = tx_match.group(4)
        rest = tx_match.group(5).strip()

        op_month_num = _resolve_month(op_month) or 0
        op_year = end_year
        if op_month_num > end_month_num:
            op_year = start_year

        post_month_num = _resolve_month(post_month) or 0
        post_year = end_year
        if post_month_num > end_month_num:
            post_year = start_year

        op_date = _resolve_date(op_day, op_month, op_year)
        post_date = _resolve_date(post_day, post_month, post_year)
        if not op_date:
            continue

        amount, desc, cibc_category = _extract_amount_and_desc(rest)
        if amount is None:
            continue

        desc = re.sub(r'\s+', ' ', desc).strip()

        if current_section == 'payments':
            direction = 'payment'
        elif current_section == 'interest':
            direction = 'interest'
        else:
            direction = 'purchase'

        transactions.append({
            'amount': round(amount, 2),
            'description': desc,
            'raw_description': line.strip(),
            'normalized_merchant': desc,
            'date': op_date,
            'posting_date': post_date,
            'time': None,
            'bank': 'CIBC',
            'card_type': 'Credit',
            'category': 'Uncategorized',
            'tags': [],
            'source_type': 'pdf',
            'source_ref': document_id,
            'duplicate_status': 'unchecked',
            'duplicate_group_id': None,
            'full_email': None,
            'direction': direction,
        })

    return {
        'template': 'cibc_credit',
        'bank': 'CIBC',
        'card_type': 'Credit',
        'card_number': card_number,
        'statement_period': f'{period_start} to {period_end}' if period_start else None,
        'previous_balance': previous_balance,
        'total_balance': total_balance,
        'minimum_payment': minimum_payment,
        'due_date': due_date,
        'credit_limit': credit_limit,
        'total_payments': total_payments,
        'total_purchases': total_purchases,
        'total_interest': total_interest,
        'transactions_found': len(transactions),
        'transactions': transactions,
    }
