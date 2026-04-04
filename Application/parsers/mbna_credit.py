import re
from datetime import datetime


TEMPLATE_META = {
    'id': 'mbna_credit',
    'bank': 'MBNA',
    'account_type': 'Mastercard Credit Card',
    'country': 'Canada',
    'detection_keywords': ['MBNA', 'Your Credit Card Account Statement', '5584'],
    'fields_extracted': [
        'statement_period', 'card_number', 'previous_balance', 'total_balance',
        'minimum_payment', 'due_date', 'credit_limit', 'total_payments',
        'total_purchases', 'total_interest',
    ],
    'transaction_fields': ['date', 'posting_date', 'description', 'amount', 'direction'],
    'date_format': 'MM/DD/YY',
    'columns': ['Amount($)'],
    'notes': 'English MBNA Mastercard credit card statement. Handles three sections (PAYMENTS, PURCHASES, INTEREST CHARGED), multi-line FX transactions, 4-digit reference numbers.',
}


DETECT_RE = re.compile(r'MBNA', re.IGNORECASE)

STATEMENT_PERIOD_RE = re.compile(
    r'Statement\s*Period[:\s]*(\d{2}/\d{2}/\d{2})\s*to\s*(\d{2}/\d{2}/\d{2})',
    re.IGNORECASE,
)

CARD_NUMBER_RE = re.compile(r'(5584\s*90\w{2}\s*\w{4}\s*4515)')

PREV_BALANCE_RE = re.compile(r'Previous\s+Statement\s*Balance\s+\$([\d,]+\.\d{2})')
NEW_BALANCE_RE = re.compile(r'(?:Your\s*)?New\s*Balance\s+\$([\d,]+\.\d{2})')
MIN_PAYMENT_RE = re.compile(r'(?:Your\s*)?Minimum\s*Payment\s+\$([\d,]+\.\d{2})')
DUE_DATE_RE = re.compile(r'(?:Your\s*)?Minimum\s*Payment\s*Due\s*Date\s+(\w+\s*\d{1,2},\s*\d{4})')
CREDIT_LIMIT_RE = re.compile(r'Credit\s*Limit\s+\$([\d,]+\.\d{2})')

TX_LINE_RE = re.compile(
    r'^(\d{2}/\d{2}/\d{2})\s+(\d{2}/\d{2}/\d{2})\s+(.*?)\s+(-?\$[\d,]+\.\d{2})$'
)

SUMMARY_PAYMENTS_RE = re.compile(r'Payments\s+(-?\$[\d,]+\.\d{2})')
SUMMARY_PURCHASES_RE = re.compile(r'New\s+Purchases\s+\$?([\d,]+\.\d{2})')
SUMMARY_INTEREST_RE = re.compile(r'Interest\s+\$?([\d,]+\.\d{2})')

SECTION_PAYMENTS_RE = re.compile(r'^PAYMENTS$', re.IGNORECASE)
SECTION_PURCHASES_RE = re.compile(r'^PURCHASES$', re.IGNORECASE)
SECTION_INTEREST_RE = re.compile(r'^INTEREST\s*CHARGED$', re.IGNORECASE)
SECTION_TOTAL_RE = re.compile(r'^Total\s+(-?\$[\d,]+\.\d{2})$')

SKIP_PATTERNS = [
    'Your Credit Card Account',
    'Statement Date:',
    'Previous Statement:',
    'StatementPeriod:',
    'Interest information',
    'AnnualInterest',
    'Annual Interest',
    'Promotional',
    'StandardAIR',
    'ProjectedPromotional',
    'ImportantInterest',
    'TheMinimumPayment',
    'latewithinthenext',
    'yourAccountAgreement',
    'Details of your transactions',
    'Trans Posting',
    'Date Date Description',
    'Previous statement balance',
    'Previousstatementbalance',
    'SubtotalofActivity',
    'Subtotal of Activity',
    'NewBalance',
    'New Balance',
    'continuedonnextpage',
    'continued on next page',
    'Page ',
    'PLEASEREVIEW',
    'Understanding',
    'Payment slip',
    'TDMBA',
    'IfyouhaveanyactivePayment',
    'lessyourMonthly',
    'ImportantNotice',
    'Save with',
    'Savea',
    'Seemoredetails',
    'carrentals',
    'participatinglocations',
    'QuoteAWD',
    'QuoteBCD',
    'Youraccountispastdue',
    'thepayment,please',
    'youpaytheRequired',
    'PlansandreturntherelatedbalancestoyourannualinterestrateforPurchases',
]

FX_LINE_RE = re.compile(
    r'^([\d.,]+)\s+([A-Z]{3})\s+(\d{4})\s+(\$[\d,]+\.\d{2})$'
)

TX_NO_AMOUNT_RE = re.compile(
    r'^(\d{2}/\d{2}/\d{2})\s+(\d{2}/\d{2}/\d{2})\s+(.+)$'
)


def detect(full_text):
    return bool(DETECT_RE.search(full_text) and
                re.search(r'Your Credit Card Account Statement', full_text))


def _parse_amount(s):
    s = s.strip()
    negative = s.startswith('-')
    cleaned = s.replace('$', '').replace(',', '').replace('-', '')
    val = float(cleaned)
    return -val if negative else val


def _parse_dollar(s):
    if s is None:
        return None
    return float(s.replace(',', ''))


def _parse_date(ds):
    try:
        return datetime.strptime(ds, '%m/%d/%y').strftime('%Y-%m-%d')
    except ValueError:
        return None


def _should_skip(line):
    for pat in SKIP_PATTERNS:
        if pat in line:
            return True
    return False


def _extract_summary(full_text):
    summary = {}
    m = SUMMARY_PAYMENTS_RE.search(full_text)
    if m:
        summary['payments'] = abs(_parse_amount(m.group(1)))
    m = SUMMARY_PURCHASES_RE.search(full_text)
    if m:
        summary['purchases'] = _parse_dollar(m.group(1))
    m = SUMMARY_INTEREST_RE.search(full_text)
    if m:
        summary['interest'] = _parse_dollar(m.group(1))
    return summary


def _build_tx(desc, raw_line, trans_date, post_date, amount, direction, document_id):
    return {
        'amount': round(amount, 2),
        'description': desc,
        'raw_description': raw_line,
        'normalized_merchant': desc,
        'date': trans_date,
        'posting_date': post_date,
        'time': None,
        'bank': 'MBNA',
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
    summary = _extract_summary(full_text)

    card_m = CARD_NUMBER_RE.search(full_text)
    card_number = card_m.group(1).strip() if card_m else None

    period_match = STATEMENT_PERIOD_RE.search(full_text)
    period_start = _parse_date(period_match.group(1)) if period_match else None
    period_end = _parse_date(period_match.group(2)) if period_match else None

    prev_m = PREV_BALANCE_RE.search(full_text)
    previous_balance = _parse_dollar(prev_m.group(1)) if prev_m else None

    new_m = NEW_BALANCE_RE.search(full_text)
    total_balance = _parse_dollar(new_m.group(1)) if new_m else None

    min_m = MIN_PAYMENT_RE.search(full_text)
    minimum_payment = _parse_dollar(min_m.group(1)) if min_m else None

    due_m = DUE_DATE_RE.search(full_text)
    due_date = due_m.group(1).strip() if due_m else None

    cl_m = CREDIT_LIMIT_RE.search(full_text)
    credit_limit = _parse_dollar(cl_m.group(1)) if cl_m else None

    transactions = []
    current_section = None
    pending_tx = None
    pending_raw = None

    for page_text in pages_text:
        lines = page_text.split('\n')
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            if SECTION_PAYMENTS_RE.match(stripped):
                current_section = 'payment'
                continue
            if SECTION_PURCHASES_RE.match(stripped):
                current_section = 'purchase'
                continue
            if SECTION_INTEREST_RE.match(stripped):
                current_section = 'interest'
                continue

            if SECTION_TOTAL_RE.match(stripped):
                if pending_tx:
                    transactions.append(pending_tx)
                    pending_tx = None
                continue

            if current_section is None:
                continue

            if _should_skip(stripped):
                continue

            tx_match = TX_LINE_RE.match(stripped)
            if tx_match:
                if pending_tx:
                    transactions.append(pending_tx)

                trans_date = _parse_date(tx_match.group(1))
                post_date = _parse_date(tx_match.group(2))
                rest = tx_match.group(3)
                raw_amount = tx_match.group(4)
                amount = abs(_parse_amount(raw_amount))

                ref_match = re.search(r'\s+(\d{4})$', rest)
                desc = rest[:ref_match.start()].strip() if ref_match else rest.strip()

                pending_tx = _build_tx(desc, stripped, trans_date, post_date, amount, current_section, document_id)
                continue

            fx_match = FX_LINE_RE.match(stripped)
            if fx_match and pending_tx:
                fx_info = f"{fx_match.group(1)} {fx_match.group(2)}"
                pending_tx['description'] += f" ({fx_info})"
                pending_tx['normalized_merchant'] = pending_tx['description']
                pending_tx['raw_description'] += ' | ' + stripped
                amount = abs(_parse_amount(fx_match.group(4)))
                pending_tx['amount'] = round(amount, 2)
                continue

            no_amt = TX_NO_AMOUNT_RE.match(stripped)
            if no_amt and current_section:
                if pending_tx:
                    transactions.append(pending_tx)

                trans_date = _parse_date(no_amt.group(1))
                post_date = _parse_date(no_amt.group(2))
                desc = no_amt.group(3).strip()

                pending_tx = _build_tx(desc, stripped, trans_date, post_date, 0, current_section, document_id)
                continue

    if pending_tx:
        transactions.append(pending_tx)

    total_payments = sum(t['amount'] for t in transactions if t['direction'] == 'payment')
    total_purchases = sum(t['amount'] for t in transactions if t['direction'] == 'purchase')
    total_interest = sum(t['amount'] for t in transactions if t['direction'] == 'interest')

    return {
        'template': 'mbna_credit',
        'bank': 'MBNA',
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
