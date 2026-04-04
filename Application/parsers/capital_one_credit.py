import re
from datetime import datetime


TEMPLATE_META = {
    'id': 'capital_one_credit',
    'bank': 'Capital One',
    'account_type': 'Mastercard Credit Card',
    'country': 'Canada',
    'detection_keywords': ['Capital One', 'Mastercard', 'capitalone.ca'],
    'fields_extracted': [
        'statement_period', 'card_number', 'previous_balance', 'total_balance',
        'minimum_payment', 'due_date', 'credit_limit', 'total_payments',
        'total_purchases', 'total_interest',
    ],
    'transaction_fields': ['date', 'posting_date', 'description', 'amount', 'direction'],
    'date_format': 'Mon DD (year inferred from statement period)',
    'columns': ['Amount'],
    'notes': 'English Capital One Mastercard credit card statement. Three sections: Payments/Credits/Adjustments, Transactions, Other Charges (interest). Handles multi-line FX transactions with USD conversion rates.',
}

EN_MONTH_MAP = {
    'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAY': 5, 'JUN': 6,
    'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12,
}
MONTH_ABBRS = '|'.join(EN_MONTH_MAP.keys())

STATEMENT_PERIOD_RE = re.compile(
    r'Statement\s+Period:\s*(\w{3})\s+(\d{1,2}),?\s+(\d{4})\s*-\s*(\w{3})\s+(\d{1,2}),?\s+(\d{4})',
    re.IGNORECASE,
)

CARD_RE = re.compile(r'ending\s+in\s+(\d{4})')

PREV_BALANCE_RE = re.compile(r'Previous\s+Balance\s+\$([\d,]+\.\d{2})')
NEW_BALANCE_RE = re.compile(r'New\s+Balance\s+=?\s*\$([\d,]+\.\d{2})')
MIN_PAYMENT_RE = re.compile(r'\$[\d,]+\.\d{2}\s+\$([\d,]+\.\d{2})\s+\w+\s+\d{1,2},\s*\d{4}')
DUE_DATE_RE = re.compile(r'Payment\s+Due\s+Date.*?\n\s*(\w+\s+\d{1,2},\s*\d{4})', re.DOTALL)
CREDIT_LIMIT_RE = re.compile(r'Credit\s+Limit\s+\$([\d,]+\.\d{2})')

SUMMARY_PAYMENTS_RE = re.compile(r'Payments\s+-\s*\$([\d,]+\.\d{2})')
SUMMARY_OTHER_CREDITS_RE = re.compile(r'Other\s+Credits\s+-\s*\$([\d,]+\.\d{2})')
SUMMARY_TRANSACTIONS_RE = re.compile(r'Transactions\s+\+\s*\$([\d,]+\.\d{2})')
SUMMARY_INTEREST_RE = re.compile(r'Interest\s+Charged\s+\+\s*\$([\d,]+\.\d{2})')

TX_LINE_RE = re.compile(
    r'^(' + MONTH_ABBRS + r')\s+(\d{1,2})\s+(' + MONTH_ABBRS + r')\s+(\d{1,2})\s+(.*?)\s+(-\s*\$[\d,]+\.\d{2}|\$[\d,]+\.\d{2})$',
    re.IGNORECASE,
)

SECTION_PAYMENTS_RE = re.compile(r'Payments,\s*Credits\s*&\s*Adjustments', re.IGNORECASE)
SECTION_TRANSACTIONS_RE = re.compile(r'#\s*\d{4}:\s*Transactions$', re.IGNORECASE)
SECTION_OTHER_CHARGES_RE = re.compile(r'^OTHER\s+CHARGES$', re.IGNORECASE)
SECTION_TOTAL_RE = re.compile(r'Total\s+(Payments|Transactions)', re.IGNORECASE)

FX_LINE_RE = re.compile(r'^([\d.]+)\s+([A-Z]{3})\s+@\s+([\d.]+)\*?$')

SKIP_PATTERNS = [
    'Transaction Date',
    'Posting Date',
    'Description',
    'Page ',
    'Capital One Mastercard',
    'Statement Period',
    'ACCOUNT ACTIVITY',
    'MAMADOU FALL',
    'Summary for This Period',
    'Total Purchases',
    'Total Cash Advances',
    'Total Special',
    'Type of Balance',
]


def detect(full_text):
    return bool(re.search(r'Capital One Mastercard', full_text, re.IGNORECASE))


def _parse_dollar(s):
    if s is None:
        return None
    return float(s.replace(',', ''))


def _parse_amount(s):
    s = s.strip()
    negative = '-' in s.split('$')[0] if '$' in s else s.startswith('-')
    cleaned = s.replace('$', '').replace(',', '').replace('-', '').replace(' ', '')
    val = float(cleaned)
    return -val if negative else val


def _resolve_date(month_str, day_str, period_start_year, period_end_year, period_end_month):
    month = EN_MONTH_MAP.get(month_str.upper())
    if month is None:
        return None
    day = int(day_str)
    if month > period_end_month:
        year = period_start_year
    else:
        year = period_end_year
    try:
        return datetime(year, month, day).strftime('%Y-%m-%d')
    except ValueError:
        return None


def _should_skip(line):
    for pat in SKIP_PATTERNS:
        if pat in line:
            return True
    return False


def _build_tx(desc, raw_line, trans_date, post_date, amount, direction, document_id):
    return {
        'amount': round(abs(amount), 2),
        'description': desc,
        'raw_description': raw_line,
        'normalized_merchant': desc,
        'date': trans_date,
        'posting_date': post_date,
        'time': None,
        'bank': 'Capital One',
        'card_type': 'Credit',
        'category': 'Uncategorized',
        'tags': [],
        'source_type': 'pdf',
        'source_ref': document_id,
        'duplicate_status': 'unchecked',
        'duplicate_group_id': None,
        'full_email': None,
        'direction': direction,
    }


def parse(pages_text, document_id=None, filepath=None):
    full_text = '\n'.join(pages_text)

    period_match = STATEMENT_PERIOD_RE.search(full_text)
    if period_match:
        period_start_year = int(period_match.group(3))
        period_end_month = EN_MONTH_MAP.get(period_match.group(4).upper(), 12)
        period_end_year = int(period_match.group(6))
        period_start = datetime(
            period_start_year,
            EN_MONTH_MAP.get(period_match.group(1).upper(), 1),
            int(period_match.group(2))
        ).strftime('%Y-%m-%d')
        period_end = datetime(
            period_end_year,
            period_end_month,
            int(period_match.group(5))
        ).strftime('%Y-%m-%d')
    else:
        period_start_year = period_end_year = datetime.now().year
        period_end_month = 12
        period_start = period_end = None

    card_m = CARD_RE.search(full_text)
    card_number = card_m.group(1) if card_m else None

    prev_m = PREV_BALANCE_RE.search(full_text)
    previous_balance = _parse_dollar(prev_m.group(1)) if prev_m else None

    new_m = NEW_BALANCE_RE.search(full_text)
    total_balance = _parse_dollar(new_m.group(1)) if new_m else None

    cl_m = CREDIT_LIMIT_RE.search(full_text)
    credit_limit = _parse_dollar(cl_m.group(1)) if cl_m else None

    due_m = DUE_DATE_RE.search(full_text)
    due_date = due_m.group(1).strip() if due_m else None

    min_m = MIN_PAYMENT_RE.search(full_text)
    minimum_payment = _parse_dollar(min_m.group(1)) if min_m else None

    sum_payments = 0
    sp = SUMMARY_PAYMENTS_RE.search(full_text)
    if sp:
        sum_payments = _parse_dollar(sp.group(1))
    soc = SUMMARY_OTHER_CREDITS_RE.search(full_text)
    if soc:
        sum_payments += _parse_dollar(soc.group(1))
    sum_purchases = None
    st = SUMMARY_TRANSACTIONS_RE.search(full_text)
    if st:
        sum_purchases = _parse_dollar(st.group(1))
    sum_interest = None
    si = SUMMARY_INTEREST_RE.search(full_text)
    if si:
        sum_interest = _parse_dollar(si.group(1))

    transactions = []
    current_section = None
    pending_tx = None

    for page_text in pages_text:
        lines = page_text.split('\n')
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            if SECTION_PAYMENTS_RE.search(stripped):
                current_section = 'payment'
                continue
            if SECTION_TRANSACTIONS_RE.search(stripped):
                current_section = 'purchase'
                continue
            if SECTION_OTHER_CHARGES_RE.match(stripped):
                current_section = 'interest'
                continue

            if SECTION_TOTAL_RE.search(stripped):
                if pending_tx:
                    transactions.append(pending_tx)
                    pending_tx = None
                continue

            if 'Summary for This Period' in stripped:
                if pending_tx:
                    transactions.append(pending_tx)
                    pending_tx = None
                current_section = None
                continue

            if current_section is None:
                continue

            if _should_skip(stripped):
                continue

            tx_match = TX_LINE_RE.match(stripped)
            if tx_match:
                if pending_tx:
                    transactions.append(pending_tx)

                trans_date = _resolve_date(
                    tx_match.group(1), tx_match.group(2),
                    period_start_year, period_end_year, period_end_month
                )
                post_date = _resolve_date(
                    tx_match.group(3), tx_match.group(4),
                    period_start_year, period_end_year, period_end_month
                )
                desc = tx_match.group(5).strip()
                amount = _parse_amount(tx_match.group(6))

                direction = current_section

                pending_tx = _build_tx(desc, stripped, trans_date, post_date, amount, direction, document_id)
                continue

            fx_match = FX_LINE_RE.match(stripped)
            if fx_match and pending_tx:
                fx_info = f"{fx_match.group(1)} {fx_match.group(2)}"
                pending_tx['description'] += f" ({fx_info})"
                pending_tx['normalized_merchant'] = pending_tx['description']
                pending_tx['raw_description'] += ' | ' + stripped
                continue

    if pending_tx:
        transactions.append(pending_tx)

    total_payments = sum(t['amount'] for t in transactions if t['direction'] == 'payment')
    total_purchases = sum(t['amount'] for t in transactions if t['direction'] == 'purchase')
    total_interest = sum(t['amount'] for t in transactions if t['direction'] == 'interest')

    return {
        'template': 'capital_one_credit',
        'bank': 'Capital One',
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


def metadata():
    return dict(TEMPLATE_META)
