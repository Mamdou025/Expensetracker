import re
from datetime import datetime


EN_MONTH_MAP = {
    'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAY': 5, 'JUN': 6,
    'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12,
    'JANUARY': 1, 'FEBRUARY': 2, 'MARCH': 3, 'APRIL': 4, 'JUNE': 6,
    'JULY': 7, 'AUGUST': 8, 'SEPTEMBER': 9, 'OCTOBER': 10, 'NOVEMBER': 11, 'DECEMBER': 12,
}

TEMPLATE_META = {
    'id': 'triangle_credit',
    'bank': 'Triangle_credit',
    'account_type': 'Mastercard Credit Card',
    'country': 'Canada',
    'detection_keywords': ['Triangle', 'Canadian Tire Bank', 'ctfs.com', 'triangle.com'],
    'fields_extracted': [
        'statement_period', 'card_number', 'previous_balance',
        'total_balance', 'minimum_payment', 'due_date',
        'credit_limit', 'total_purchases', 'total_interest',
    ],
    'transaction_fields': ['date', 'posting_date', 'description', 'amount', 'direction'],
    'date_format': 'Mon DD (year inferred from statement period)',
    'columns': ['AMOUNT ($)'],
    'notes': 'English Triangle Mastercard (Canadian Tire Bank) credit card statement. Sections: Purchases, Cash Transactions, Payments, Interest charges.',
}

STATEMENT_PERIOD_RE = re.compile(
    r'For\s+the\s+period:\s*(\w+)\s+(\d{1,2}),?\s+(\d{4})\s+to\s+(\w+)\s+(\d{1,2}),?\s+(\d{4})',
    re.IGNORECASE,
)

CARD_NUMBER_RE = re.compile(r'(\d{4}\s+\d{2}XX\s+XXXX\s+\d{4})')

PREV_BALANCE_RE = re.compile(r'Balance\s+from\s+your\s+last\s+statement\s+\$?([\d,]+\.\d{2})')
NEW_BALANCE_RE = re.compile(r'Your\s+New\s+Balance\s+\$?([\d,]+\.\d{2})')
CREDIT_LIMIT_RE = re.compile(r'Credit\s+limit\s+\$?([\d,]+\.\d{2})')
MIN_PAYMENT_RE = re.compile(r'Minimum\s+payment\s+due\s+\$?([\d,]+\.\d{2})')
DUE_DATE_RE = re.compile(r'Payment\s+due\s+date\s+(\w+\s+\d{1,2},?\s+\d{4})', re.IGNORECASE)
TOTAL_PURCHASES_RE = re.compile(r'Total\s+charges\s+\$?([\d,]+\.\d{2})')
TOTAL_INTEREST_RE = re.compile(r'Total\s+interest\s+charges\s+\$?([\d,]+\.\d{2})')

MONTH_ABBRS = '|'.join(sorted(EN_MONTH_MAP.keys(), key=len, reverse=True))
TX_LINE_NEGATIVE_RE = re.compile(
    r'^(' + MONTH_ABBRS + r')\s+(\d{1,2})\s+(' + MONTH_ABBRS + r')\s+(\d{1,2})\s+(.+?)\s+-\s*([\d,]+\.\d{2})(?:\s|$)',
    re.IGNORECASE,
)
TX_LINE_RE = re.compile(
    r'^(' + MONTH_ABBRS + r')\s+(\d{1,2})\s+(' + MONTH_ABBRS + r')\s+(\d{1,2})\s+(.+?)\s+([\d,]+\.\d{2})(?:\s|$)',
    re.IGNORECASE,
)

SKIP_PATTERNS = [
    'MESSAGES::', 'Your account number', 'Statement date', 'For the period',
    'Your account summary', 'Account number', 'See details', 'Your account online',
    'Balance from', 'Payments received', 'Returns and other', 'Total credits',
    'Purchases', 'Cash transactions', 'Fees', 'Interest charges', 'Total charges',
    'Your New Balance', 'Credit limit', 'Available credit', 'Your payment information',
    'totals below', 'Equal Payments', 'Balance Due', 'Pay this amount',
    'Minimum payment', 'default', 'minimum payment due', 'approximately',
    'Payment due date', 'Please allow', 'QUESTIONS', 'triangle.com',
    'Customer service', '1-800-459', 'Previous', 'balance', 'Adjustments',
    'Redeemed', 'Bonus', 'Page ', 'SEE PAGE', 'WAYS TO PAY', 'CTB B',
    'MAMADOU', 'LAVAL', 'TREMBLES', 'Details of your', 'Billing errors',
    'notify us', 'dispute', 'However', 'understated', 'stolen or lost',
    'from Canada', 'collect at', 'Minimum payment', 'new balance',
    'paying the minimum', 'current interest', 'promotional', 'using 30 days',
    'excluding charges', 'optional products', 'first month',
    'Making payments', 'Payment methods', 'remittance', 'Gift cards',
    'TRANSACTION', 'DATE', 'TRANSACTION DESCRIPTION', 'AMOUNT',
    'Total purchases', 'Total payments', 'Total cash', 'Other details',
    'ANNUAL INTEREST', 'DAILY INTEREST', 'INTEREST', 'CHARGES',
    'TRANSACTION TYPE', 'Cash Transactions', 'Pre-authorized',
    'statement balance', 'PAD agreement', 'Receiving promotional',
    'telemarketers', 'Canadian Tire Bank', 'P.O. Box', 'mailing address',
    'Loyalty rewards', 'Terms, conditions', 'Charges include',
    'HST', 'PST', 'Tax rates', 'Triangle Rewards', 'Corporation',
    'Triangle Mastercard', 'issued by', 'Unless otherwise',
    'trademarks', 'Mastercard International', 'Online', 'banking',
    'Canadian Tire store', 'ensure you write', 'mail payment',
    'New address', 'Let us know', 'Have your card', 'Information about',
    'Your Triangle', 'Card #', 'Statement date',
    '00043',
]


def _parse_amount(text):
    return float(text.replace(',', ''))


def _resolve_month(month_str):
    upper = month_str.upper().strip()
    for key, val in EN_MONTH_MAP.items():
        if upper == key or upper.startswith(key):
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
    for pattern in SKIP_PATTERNS:
        if pattern in line:
            return True
    return False


def metadata():
    return TEMPLATE_META


def detect(full_text):
    lower = full_text.lower()
    return (
        ('triangle' in lower or 'canadian tire bank' in lower or 'ctfs.com' in lower)
        and ('amount ($)' in lower or 'transaction description' in lower)
        and ('statement date' in lower or 'for the period' in lower)
    )


def parse(pages_text, document_id=None, filepath=None):
    full_text = '\n'.join(pages_text)

    period_match = STATEMENT_PERIOD_RE.search(full_text)
    if not period_match:
        return None

    start_month_str = period_match.group(1)
    start_day = period_match.group(2)
    start_year = int(period_match.group(3))
    end_month_str = period_match.group(4)
    end_day = period_match.group(5)
    end_year = int(period_match.group(6))

    period_start = _resolve_date(start_day, start_month_str, start_year)
    period_end = _resolve_date(end_day, end_month_str, end_year)
    end_month_num = _resolve_month(end_month_str) or 12

    card_match = CARD_NUMBER_RE.search(full_text)
    card_number = card_match.group(1) if card_match else None

    prev_match = PREV_BALANCE_RE.search(full_text)
    previous_balance = _parse_amount(prev_match.group(1)) if prev_match else None

    new_match = NEW_BALANCE_RE.search(full_text)
    total_balance = _parse_amount(new_match.group(1)) if new_match else None

    limit_match = CREDIT_LIMIT_RE.search(full_text)
    credit_limit = _parse_amount(limit_match.group(1)) if limit_match else None

    min_match = MIN_PAYMENT_RE.search(full_text)
    minimum_payment = _parse_amount(min_match.group(1)) if min_match else None

    due_match = DUE_DATE_RE.search(full_text)
    due_date = None
    if due_match:
        due_str = due_match.group(1)
        parts = re.match(r'(\w+)\s+(\d{1,2}),?\s+(\d{4})', due_str)
        if parts:
            due_date = _resolve_date(parts.group(2), parts.group(1), int(parts.group(3)))

    purchases_match = TOTAL_PURCHASES_RE.search(full_text)
    total_purchases = _parse_amount(purchases_match.group(1)) if purchases_match else None

    interest_match = TOTAL_INTEREST_RE.search(full_text)
    total_interest = _parse_amount(interest_match.group(1)) if interest_match else None

    all_lines = []
    for page_text in pages_text:
        for line in page_text.split('\n'):
            all_lines.append(line.strip())

    transactions = []
    current_section = None

    for line in all_lines:
        if not line or len(line) < 5:
            continue

        if re.match(r'^Purchases\s*-\s*Card\s*#', line, re.IGNORECASE):
            current_section = 'purchases'
            continue
        elif re.match(r'^Payments\s*-\s*Card\s*#', line, re.IGNORECASE) or 'Payments and credits' in line:
            current_section = 'payments'
            continue
        elif re.match(r'^Cash\s+transactions?\s*-\s*Card\s*#', line, re.IGNORECASE):
            current_section = 'cash'
            continue
        elif 'Other details about your account' in line:
            current_section = None
            continue
        elif 'Details of your interest' in line:
            current_section = None
            continue
        elif 'Information about your account' in line:
            current_section = None
            continue

        if current_section is None:
            continue

        neg_match = TX_LINE_NEGATIVE_RE.match(line)
        tx_match = TX_LINE_RE.match(line) if not neg_match else None

        match = neg_match or tx_match
        if not match:
            continue

        op_month = match.group(1)
        op_day = match.group(2)
        post_month = match.group(3)
        post_day = match.group(4)
        rest = match.group(5).strip()
        amt_str = match.group(6)

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

        amount = _parse_amount(amt_str)
        desc = re.sub(r'\s+', ' ', rest).strip()

        is_credit = neg_match is not None
        if current_section == 'payments':
            direction = 'payment'
        elif current_section == 'cash':
            direction = 'cash_advance'
        elif is_credit:
            direction = 'refund'
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
            'bank': 'Triangle_credit',
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
        'template': 'triangle_credit',
        'bank': 'Triangle_credit',
        'card_type': 'Credit',
        'card_number': card_number,
        'statement_period': f'{period_start} to {period_end}' if period_start else None,
        'previous_balance': previous_balance,
        'total_balance': total_balance,
        'minimum_payment': minimum_payment,
        'due_date': due_date,
        'credit_limit': credit_limit,
        'total_purchases': total_purchases,
        'total_interest': total_interest,
        'transactions_found': len(transactions),
        'transactions': transactions,
    }
