import re
from datetime import datetime

EN_MONTH_MAP = {
    'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4,
    'MAY': 5, 'JUN': 6, 'JUL': 7, 'AUG': 8,
    'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12,
}

STATEMENT_PERIOD_RE = re.compile(
    r'([A-Z][a-z]{2})\s+(\d{1,2}),?\s+(\d{4})\s*-\s*([A-Z][a-z]{2})\s+(\d{1,2}),?\s+(\d{4})',
)

CARD_NUMBER_RE = re.compile(r'[•·]{3,4}\s*(\d{4})')

PREVIOUS_BALANCE_RE = re.compile(
    r'Previous\s+Amount\s+Owing\s+([\d,]+\.\d{2})'
)

NEW_BALANCE_RE = re.compile(
    r'New\s+Amount\s+Owing\s+([\d,]+\.\d{2})'
)

MIN_PAYMENT_RE = re.compile(
    r'Minimum\s+Payment\s+([\d,]+\.\d{2})'
)

DUE_DATE_RE = re.compile(
    r'Due\s+Date\s+([A-Z][a-z]{2})\s+(\d{1,2}),?\s+(\d{4})'
)

CREDIT_LIMIT_RE = re.compile(
    r'Total\s+Credit\s+Limit\s+([\d,]+\.\d{2})'
)

PAYMENTS_RE = re.compile(
    r'\(-\)\s+Payments\s+([\d,]+\.\d{2})'
)

PURCHASES_RE = re.compile(
    r'New\s+Purchases\s+&\s+Debits\s+([\d,]+\.\d{2})'
)

INTEREST_RE = re.compile(
    r'Interest\s+([\d,]+\.\d{2})'
)

FEES_RE = re.compile(
    r'Fees\s+([\d,]+\.\d{2})'
)

MONTH_ABBRS = '|'.join(EN_MONTH_MAP.keys())
TX_LINE_RE = re.compile(
    r'^([A-Z][a-z]{2})\s+(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{1,2})\s+(.+?)\s+(-?[\d,]+\.\d{2})\s*$'
)

AMOUNT_RE = re.compile(r'(-?[\d,]+\.\d{2})\s*$')

SKIP_KEYWORDS = [
    'Neo Financial',
    'neofinancial.com',
    '1-855-636-2265',
    'Page ',
    'Transactions',
    'Transaction',
    'Date',
    'Posted Date',
    'Description',
    'Amount ($CAD)',
    'Mamadou Fall',
    'MAMADOU FALL',
    'AVENUE DES TREMBLES',
    'LAVAL QC',
]

TEMPLATE_META = {
    'id': 'neo_credit',
    'bank': 'Neo Financial',
    'account_type': 'Mastercard Credit Card',
    'country': 'Canada',
    'detection_keywords': ['Neo Financial', 'neofinancial.com', 'Neo Mastercard'],
    'fields_extracted': [
        'statement_period',
        'card_number',
        'previous_balance',
        'total_balance',
        'minimum_payment',
        'due_date',
        'credit_limit',
        'total_payments',
        'total_purchases',
        'total_interest',
        'total_fees',
    ],
    'transaction_fields': [
        'date',
        'posting_date',
        'description',
        'amount',
        'direction',
    ],
    'date_format': 'Mon DD (English, year inferred from statement period)',
    'columns': ['Amount ($CAD)'],
    'notes': 'English Neo Financial Mastercard statement. Uses PyMuPDF (fitz) for text extraction because Neo PDFs use font obfuscation that makes pdfplumber return null bytes for digits. Negative amounts are purchases, positive are payments.',
}


def _parse_amount(text):
    return float(text.replace(',', ''))


def _resolve_date(month_abbr, day, year):
    month = EN_MONTH_MAP.get(month_abbr.upper()[:3])
    if not month:
        return None
    try:
        return datetime(year, month, int(day)).strftime('%Y-%m-%d')
    except ValueError:
        return None


def _should_skip(line):
    for kw in SKIP_KEYWORDS:
        if kw in line:
            return True
    return False


def _extract_with_fitz(filepath):
    import fitz
    doc = fitz.open(filepath)
    pages = []
    for page in doc:
        pages.append(page.get_text())
    doc.close()
    return pages


def metadata():
    return TEMPLATE_META


def detect(full_text):
    lower = full_text.lower()
    return (
        ('neo financial' in lower or 'neofinancial' in lower)
        and ('amount ($cad)' in lower or 'amount (\x00cad)' in lower or 'credit rate' in lower.replace('\x00', ''))
    )


def parse(pages_text, document_id=None, filepath=None):
    if not filepath:
        return None

    fitz_pages = _extract_with_fitz(filepath)
    full_text = '\n'.join(fitz_pages)

    period_match = STATEMENT_PERIOD_RE.search(full_text)
    if not period_match:
        return None

    start_month_abbr = period_match.group(1)
    start_day = period_match.group(2)
    start_year = int(period_match.group(3))
    end_month_abbr = period_match.group(4)
    end_day = period_match.group(5)
    end_year = int(period_match.group(6))

    period_start = _resolve_date(start_month_abbr, start_day, start_year)
    period_end = _resolve_date(end_month_abbr, end_day, end_year)

    card_match = CARD_NUMBER_RE.search(full_text)
    card_number = card_match.group(1) if card_match else None

    prev_match = PREVIOUS_BALANCE_RE.search(full_text)
    previous_balance = _parse_amount(prev_match.group(1)) if prev_match else None

    new_match = NEW_BALANCE_RE.search(full_text)
    total_balance = _parse_amount(new_match.group(1)) if new_match else None

    min_pay_match = MIN_PAYMENT_RE.search(full_text)
    minimum_payment = _parse_amount(min_pay_match.group(1)) if min_pay_match else None

    due_match = DUE_DATE_RE.search(full_text)
    due_date = None
    if due_match:
        due_date = _resolve_date(due_match.group(1), due_match.group(2), int(due_match.group(3)))

    credit_match = CREDIT_LIMIT_RE.search(full_text)
    credit_limit = _parse_amount(credit_match.group(1)) if credit_match else None

    payments_match = PAYMENTS_RE.search(full_text)
    total_payments = _parse_amount(payments_match.group(1)) if payments_match else None

    purchases_match = PURCHASES_RE.search(full_text)
    total_purchases = _parse_amount(purchases_match.group(1)) if purchases_match else None

    interest_match = INTEREST_RE.search(full_text)
    total_interest = _parse_amount(interest_match.group(1)) if interest_match else None

    fees_match = FEES_RE.search(full_text)
    total_fees = _parse_amount(fees_match.group(1)) if fees_match else None

    transactions = []
    all_lines = []
    for page_text in fitz_pages:
        for line in page_text.split('\n'):
            stripped = line.strip()
            if stripped:
                all_lines.append(stripped)

    DATE_LINE_RE = re.compile(r'^([A-Z][a-z]{2})\s+(\d{1,2})$')
    AMOUNT_LINE_RE = re.compile(r'^(-?[\d,]+\.\d{2})$')

    end_month_num = EN_MONTH_MAP.get(end_month_abbr.upper()[:3], 12)

    in_transactions = False
    i = 0

    while i < len(all_lines):
        line = all_lines[i]

        if 'Amount ($CAD)' in line and i > 0 and 'Description' in all_lines[i-1]:
            in_transactions = True
            i += 1
            continue

        if 'Important information' in line or 'Frequently Asked' in line:
            in_transactions = False
            i += 1
            continue

        if not in_transactions:
            i += 1
            continue

        if _should_skip(line):
            i += 1
            continue

        date_match = DATE_LINE_RE.match(line)
        if date_match and i + 3 < len(all_lines):
            tx_month = date_match.group(1)
            tx_day = date_match.group(2)

            next_line = all_lines[i + 1]
            post_match = DATE_LINE_RE.match(next_line)

            if post_match:
                post_month = post_match.group(1)
                post_day = post_match.group(2)

                desc_lines = []
                j = i + 2
                while j < len(all_lines):
                    candidate = all_lines[j]
                    amt_check = AMOUNT_LINE_RE.match(candidate)
                    if amt_check:
                        break
                    if _should_skip(candidate) or DATE_LINE_RE.match(candidate):
                        break
                    desc_lines.append(candidate)
                    j += 1

                if not desc_lines or j >= len(all_lines):
                    i += 1
                    continue

                desc = ' '.join(desc_lines)
                amount_line = all_lines[j]

                amt_match = AMOUNT_LINE_RE.match(amount_line)
                if amt_match:
                    tx_month_num = EN_MONTH_MAP.get(tx_month.upper()[:3], 0)
                    tx_year = end_year
                    if tx_month_num > end_month_num:
                        tx_year = start_year

                    post_month_num = EN_MONTH_MAP.get(post_month.upper()[:3], 0)
                    post_year = end_year
                    if post_month_num > end_month_num:
                        post_year = start_year

                    tx_date = _resolve_date(tx_month, tx_day, tx_year)
                    post_date = _resolve_date(post_month, post_day, post_year)
                    amount = _parse_amount(amt_match.group(1))

                    if amount < 0:
                        direction = 'purchase'
                        final_amount = abs(amount)
                    else:
                        direction = 'payment'
                        final_amount = amount

                    raw = f'{tx_month} {tx_day} {post_month} {post_day} {desc} {amt_match.group(1)}'

                    transactions.append({
                        'amount': round(final_amount, 2),
                        'description': desc,
                        'raw_description': raw,
                        'normalized_merchant': desc,
                        'date': tx_date,
                        'posting_date': post_date,
                        'time': None,
                        'bank': 'Neo Financial',
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
                    i = j + 1
                    continue

        i += 1

    return {
        'template': 'neo_credit',
        'bank': 'Neo Financial',
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
        'total_fees': total_fees,
        'transactions_found': len(transactions),
        'transactions': transactions,
    }
