import re
from datetime import datetime


STATEMENT_PERIOD_RE = re.compile(
    r'(?:For\s+)?(\w{3})\s+(\d{1,2})\s+to\s+(\w{3})\s+(\d{1,2}),?\s+(\d{4})'
)

ACCOUNT_NUMBER_RE = re.compile(r'Account\s+number[:\s]*(\d{2}-\d{5})')

OPENING_BALANCE_RE = re.compile(
    r'Opening\s+balance\s+on\s+\w+\s+\d+,?\s+\d{4}\s+\$?([\d,]+\.\d{2})'
)

CLOSING_BALANCE_RE = re.compile(
    r'Closing\s+balance(?:\s+on\s+\w+\s+\d+,?\s+\d{4})?\s+=?\s*\$?([\d,]+\.\d{2})'
)

TOTAL_WITHDRAWALS_RE = re.compile(r'Withdrawals\s+-\s+([\d,]+\.\d{2})')
TOTAL_DEPOSITS_RE = re.compile(r'Deposits\s+\+\s+([\d,]+\.\d{2})')

TX_LINE_RE = re.compile(
    r'^(\w{3})\s+(\d{1,2})\s+'
    r'(.+?)\s+'
    r'([\d,]+\.\d{2})\s+'
    r'([\d,]+\.\d{2})$'
)

TX_LINE_DEPOSIT_RE = re.compile(
    r'^(\w{3})\s+(\d{1,2})\s+'
    r'(.+?)\s+'
    r'([\d,]+\.\d{2})\s+'
    r'([\d,]+\.\d{2})$'
)

AMOUNT_RE = re.compile(r'([\d,]+\.\d{2})')

MONTH_MAP = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12,
}

SKIP_LINES = [
    'Opening balance',
    'Balance forward',
    'Closing balance',
    '(continued on next page)',
    'Transaction details',
    'Date Description',
    'Free Transaction',
    'Page ',
    '10774E',
    'CIBC Account Statement',
    'Account number',
    'Branch transit',
    'Account summary',
    'Contact information',
    'Important:',
]

SKIP_DESCRIPTIONS = [
    'Opening balance',
    'Balance forward',
    'Closing balance',
]

FX_LINE_RE = re.compile(r'^\d+\.\d{2}\s+USD\s+@\s+[\d.]+$')


def _parse_amount(text):
    return float(text.replace(',', ''))


def _resolve_date(month_abbr, day, year, period_start_month=None):
    month = MONTH_MAP.get(month_abbr)
    if not month:
        return None
    resolved_year = year
    if period_start_month is not None and period_start_month > month:
        resolved_year = year + 1
    try:
        return datetime(resolved_year, month, int(day)).strftime('%Y-%m-%d')
    except ValueError:
        return None


def _should_skip_line(line):
    for skip in SKIP_LINES:
        if skip in line:
            return True
    return False


def _should_skip_description(desc):
    for skip in SKIP_DESCRIPTIONS:
        if skip in desc:
            return True
    return False


def _classify_amounts(amounts, prev_balance):
    if len(amounts) < 2:
        return None, None, None

    balance = amounts[-1]

    if len(amounts) == 2:
        tx_amount = amounts[0]
        if prev_balance is not None:
            diff = prev_balance - balance
            if abs(diff - tx_amount) < 0.02:
                return tx_amount, 'withdrawal', balance
            elif abs(diff + tx_amount) < 0.02:
                return tx_amount, 'deposit', balance

        return tx_amount, 'withdrawal', balance

    if len(amounts) >= 3:
        withdrawal_candidate = amounts[0]
        deposit_candidate = amounts[1] if len(amounts) > 2 else None

        if prev_balance is not None:
            if abs((prev_balance - withdrawal_candidate) - balance) < 0.02:
                return withdrawal_candidate, 'withdrawal', balance
            if deposit_candidate and abs((prev_balance + deposit_candidate) - balance) < 0.02:
                return deposit_candidate, 'deposit', balance

        return amounts[-2], 'withdrawal', balance

    return None, None, None


TEMPLATE_META = {
    'id': 'cibc_chequing',
    'bank': 'CIBC',
    'account_type': 'Chequing',
    'country': 'Canada',
    'detection_keywords': ['CIBC Account Statement', 'Withdrawals ($)', 'Deposits ($)'],
    'fields_extracted': [
        'statement_period',
        'account_number',
        'opening_balance',
        'closing_balance',
        'total_withdrawals',
        'total_deposits',
    ],
    'transaction_fields': [
        'date',
        'description',
        'amount',
        'direction',
        'balance',
    ],
    'date_format': 'Mon DD (year inferred from header)',
    'columns': ['Withdrawals', 'Deposits', 'Balance'],
    'notes': 'Handles multi-line descriptions, FX conversion lines, service charges, and year-rollover for Dec/Jan statements.',
}


def metadata():
    return TEMPLATE_META


def detect(full_text):
    return (
        'CIBC Account Statement' in full_text
        and ('Withdrawals ($)' in full_text or 'Deposits ($)' in full_text)
    )


def parse(pages_text, document_id=None):
    full_text = '\n'.join(pages_text)

    period_match = STATEMENT_PERIOD_RE.search(full_text)
    if not period_match:
        return None

    statement_year = int(period_match.group(5))
    period_start_month_abbr = period_match.group(1)
    period_start_day = period_match.group(2)
    period_end_month_abbr = period_match.group(3)
    period_end_day = period_match.group(4)
    period_start_month_num = MONTH_MAP.get(period_start_month_abbr)

    account_match = ACCOUNT_NUMBER_RE.search(full_text)
    account_number = account_match.group(1) if account_match else None

    opening_match = OPENING_BALANCE_RE.search(full_text)
    opening_balance = _parse_amount(opening_match.group(1)) if opening_match else None

    closing_match = CLOSING_BALANCE_RE.search(full_text)
    closing_balance = _parse_amount(closing_match.group(1)) if closing_match else None

    withdrawals_match = TOTAL_WITHDRAWALS_RE.search(full_text)
    total_withdrawals = _parse_amount(withdrawals_match.group(1)) if withdrawals_match else None

    deposits_match = TOTAL_DEPOSITS_RE.search(full_text)
    total_deposits = _parse_amount(deposits_match.group(1)) if deposits_match else None

    all_lines = []
    for page_text in pages_text:
        for line in page_text.split('\n'):
            all_lines.append(line.strip())

    transactions = []
    current_date = None
    current_description_parts = []
    current_amounts = []
    current_raw_lines = []
    prev_balance = opening_balance

    date_line_re = re.compile(r'^(\w{3})\s+(\d{1,2})\s+(.*)$')
    continuation_amount_re = re.compile(r'^(.*?)\s+([\d,]+\.\d{2})(?:\s+([\d,]+\.\d{2}))?(?:\s+([\d,]+\.\d{2}))?$')

    def flush_transaction():
        nonlocal prev_balance
        if not current_date or not current_amounts:
            return

        desc = ' / '.join(p for p in current_description_parts if p)
        if _should_skip_description(desc):
            return

        tx_amount, direction, balance = _classify_amounts(current_amounts, prev_balance)
        if tx_amount is None:
            return

        if balance is not None:
            prev_balance = balance

        transactions.append({
            'amount': round(tx_amount, 2),
            'description': desc,
            'raw_description': ' | '.join(current_raw_lines),
            'normalized_merchant': desc.split(' / ')[0] if ' / ' in desc else desc,
            'date': current_date,
            'time': None,
            'bank': 'CIBC',
            'card_type': 'Debit',
            'category': 'Uncategorized',
            'tags': [],
            'source_type': 'pdf',
            'source_ref': document_id,
            'duplicate_status': 'unchecked',
            'duplicate_group_id': None,
            'full_email': None,
            'direction': direction,
        })

    i = 0
    in_transactions = False

    while i < len(all_lines):
        line = all_lines[i]

        if 'Date Description' in line and 'Balance' in line:
            in_transactions = True
            i += 1
            continue

        if not in_transactions:
            i += 1
            continue

        if _should_skip_line(line):
            i += 1
            continue

        if not line or len(line) < 3:
            i += 1
            continue

        date_match = date_line_re.match(line)
        if date_match:
            flush_transaction()

            month_abbr = date_match.group(1)
            day = date_match.group(2)
            rest = date_match.group(3).strip()

            if month_abbr not in MONTH_MAP:
                i += 1
                continue

            resolved = _resolve_date(month_abbr, day, statement_year, period_start_month_num)
            if not resolved:
                i += 1
                continue

            current_date = resolved
            current_description_parts = []
            current_amounts = []
            current_raw_lines = [line]

            amounts_in_rest = AMOUNT_RE.findall(rest)
            if amounts_in_rest:
                desc_part = rest
                for a in amounts_in_rest:
                    desc_part = desc_part.replace(a, '', 1)
                desc_part = re.sub(r'\s+', ' ', desc_part).strip().rstrip('$')
                if desc_part:
                    current_description_parts.append(desc_part)
                current_amounts = [_parse_amount(a) for a in amounts_in_rest]
            else:
                if rest:
                    current_description_parts.append(rest)
        else:
            if FX_LINE_RE.match(line):
                current_raw_lines.append(line)
                i += 1
                continue

            amounts_in_line = AMOUNT_RE.findall(line)
            if amounts_in_line:
                desc_part = line
                for a in amounts_in_line:
                    desc_part = desc_part.replace(a, '', 1)
                desc_part = re.sub(r'\s+', ' ', desc_part).strip().rstrip('$')
                if desc_part and len(desc_part) > 2:
                    flush_transaction()
                    current_description_parts = [desc_part]
                    current_amounts = [_parse_amount(a) for a in amounts_in_line]
                    current_raw_lines = [line]
                else:
                    current_amounts.extend([_parse_amount(a) for a in amounts_in_line])
                    current_raw_lines.append(line)
                    if desc_part and len(desc_part) > 1:
                        current_description_parts.append(desc_part)
            else:
                if current_date and line and not line.startswith('$'):
                    if FX_LINE_RE.match(line):
                        current_raw_lines.append(line)
                    else:
                        current_description_parts.append(line)
                        current_raw_lines.append(line)

        i += 1

    flush_transaction()

    period_start = _resolve_date(period_start_month_abbr, period_start_day, statement_year)
    period_end = _resolve_date(period_end_month_abbr, period_end_day, statement_year, period_start_month_num)

    return {
        'template': 'cibc_chequing',
        'bank': 'CIBC',
        'card_type': 'Debit',
        'account_number': account_number,
        'statement_period': f'{period_start} to {period_end}' if period_start else None,
        'opening_balance': opening_balance,
        'closing_balance': closing_balance,
        'total_withdrawals': total_withdrawals,
        'total_deposits': total_deposits,
        'transactions_found': len(transactions),
        'transactions': transactions,
    }
