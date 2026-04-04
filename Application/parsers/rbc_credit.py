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

STATEMENT_PERIOD_RE = re.compile(
    r'R(?:elev|evel)[ée]\s+du\s+(\d{1,2})\s+(\w{3,4})\s+au\s+(\d{1,2})\s+(\w{3,4})\s+(\d{4})',
    re.IGNORECASE,
)

CARD_NUMBER_RE = re.compile(r'(\d{4}\s+\d{2}\*{2}\s+\*{4}\s+\d{4})')

PREVIOUS_BALANCE_RE = re.compile(
    r'SOLDE\s+DE\s+COMPTE\s+PR[ÉE]C[ÉE]DENT\s+([\d\s]+,\d{2})\s*\$'
)

TOTAL_BALANCE_RE = re.compile(
    r'SOLDE\s+DE\s+COMPTE\s+TOTAL\s+([\d\s]+,\d{2})\s*\$'
)

MIN_PAYMENT_RE = re.compile(
    r'Paiement\s+minimum\s+([\d\s]+,\d{2})\s*\$'
)

DUE_DATE_RE = re.compile(
    r"Date\s+d'[ée]ch[ée]ance\s+(\d{1,2})\s+(\w{3,4})\s+(\d{4})"
)

CREDIT_LIMIT_RE = re.compile(
    r'Limite\s+de\s+cr[ée]dit\s+([\d\s]+,\d{2})\s*\$'
)

PAYMENTS_CREDITS_RE = re.compile(
    r'Paiements\s+et\s+cr[ée]dits\s+\(([\d\s]+,\d{2})\s*\$\)'
)

PURCHASES_DEBITS_RE = re.compile(
    r'Achats\s+et\s+d[ée]bits\s+([\d\s]+,\d{2})\s*\$'
)

INTEREST_TOTAL_RE = re.compile(
    r'Int[ée]r[êe]ts\s+([\d\s]+,\d{2})\s*\$'
)

FR_AMOUNT_RE = re.compile(
    r'\(?(\d{1,3}(?:\s\d{3})*,\d{2})\s*\$\)?'
)

MONTH_ABBRS = '|'.join(sorted(FR_MONTH_MAP.keys(), key=len, reverse=True))
TX_LINE_RE = re.compile(
    r'^(\d{1,2})\s+(' + MONTH_ABBRS + r')\s+'
    r'(\d{1,2})\s+(' + MONTH_ABBRS + r')\s+'
    r'(.+)',
    re.IGNORECASE,
)

REF_LINE_RE = re.compile(r'^\d{17,}')

SKIP_LINES = [
    'SOLDE DE COMPTE',
    'SOLDE COURANT',
    'DATE DE',
    "L'OPÉRATION",
    'DESCRIPTION DE',
    'MONTANT',
    'TITULAIRE PRINCIPAL',
    'RBC BANQUE ROYALE',
    'CENTRE DES PAIEMENTS',
    'TORONTO, ONTARIO',
    'Avion®',
    'Relevé du',
    'Revelé du',
    'DE 3',
    'Merci d',
    'RENSEIGNEMENTS',
    'POINTS AVION',
    'Solde des points',
    'Points accumulés',
    'Nouveau solde des points',
    'COMMUNIQUEZ',
    'Service à la clientèle',
    'frais virés',
    'Site Web',
    'PAIEMENTS ET TAUX',
    'Paiement minimum',
    "Date d'échéance",
    'Limite de crédit',
    'Crédit non utilisé',
    "Taux d'intérêt",
    'Achats',
    'Avances de fonds',
    'CALCUL DE VOTRE',
    'Solde de compte',
    'Paiements et crédits',
    'Achats et débits',
    'Intérêts',
    'Frais',
    'TABLEAU DES',
    'Description',
    'Temps requis',
    'Si vous',
    'impayé',
    'figurant',
    'carte de crédit',
    'démontrer',
    'pas recommandé',
    'remboursement',
    'vitez la fraude',
    'premi',
    'oubliez pas',
    'RBC ne vous',
    'Fournir',
    'Effectuer',
    'Communiquer',
    'Exiger',
    'Assurez-vous',
    'croyez',
    'composez',
    'Pour en savoir',
    'Toutes les autres marques',
    'C.P. 4016',
    'MAMADOU FALL',
    'LAVAL QC',
    'apides, pratiques',
    'Banque en direct',
    'Appli Mobile',
    'options de paiement',
    'GAB de RBC',
    'Services bancaires',
    'Succursale RBC',
    'MONTANT PAYÉ',
    'PAIEMENT MINIMUM',
    "DATE D'ÉCHÉANCE",
    'Restant',
    'section',
    'LECTURE',
    'Affectation',
]


def _parse_fr_amount(text):
    cleaned = text.replace(' ', '').replace(',', '.')
    return float(cleaned)


def _resolve_date(day, month_abbr, year, period_start_month=None):
    month = FR_MONTH_MAP.get(month_abbr.upper())
    if not month:
        return None
    resolved_year = year
    if period_start_month is not None and period_start_month > month:
        resolved_year = year + 1
    try:
        return datetime(resolved_year, month, int(day)).strftime('%Y-%m-%d')
    except ValueError:
        return None


def _should_skip(line):
    for skip in SKIP_LINES:
        if skip in line:
            return True
    return False


def _extract_amount_from_line(text):
    paren_match = re.search(r'\(\d{1,3}(?:\s\d{3})*,\d{2}\s*\$\)', text)
    if paren_match:
        inner = re.search(r'(\d{1,3}(?:\s\d{3})*,\d{2})', paren_match.group())
        amt = _parse_fr_amount(inner.group(1))
        desc = text[:paren_match.start()].strip()
        return -amt, desc

    amounts = list(FR_AMOUNT_RE.finditer(text))
    if not amounts:
        return None, text

    first_amount = amounts[0]
    amt_str = first_amount.group(1)
    amt = _parse_fr_amount(amt_str)
    desc = text[:first_amount.start()].strip()
    return amt, desc


TEMPLATE_META = {
    'id': 'rbc_credit',
    'bank': 'rbc_credit',
    'account_type': 'Visa Credit Card',
    'country': 'Canada',
    'detection_keywords': ['Avion® Visa Infinite‡ RBC®', 'Relevé du', 'SOLDE DE COMPTE'],
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
    ],
    'transaction_fields': [
        'date',
        'posting_date',
        'description',
        'amount',
        'direction',
    ],
    'date_format': 'DD MON (French, year inferred from header)',
    'columns': ['Montant'],
    'notes': 'French-language RBC Visa statement. Handles comma-decimal amounts (XX,XX $), parenthesized credits, two-date lines (operation + posting), and right-column noise filtering.',
}


def metadata():
    return TEMPLATE_META


def detect(full_text):
    return (
        'RBC' in full_text
        and ('Revelé du' in full_text or 'Relevé du' in full_text)
        and 'SOLDE DE COMPTE' in full_text
    )


def parse(pages_text, document_id=None, filepath=None):
    full_text = '\n'.join(pages_text)

    period_match = STATEMENT_PERIOD_RE.search(full_text)
    if not period_match:
        return None

    period_start_day = period_match.group(1)
    period_start_month_abbr = period_match.group(2)
    period_end_day = period_match.group(3)
    period_end_month_abbr = period_match.group(4)
    statement_year = int(period_match.group(5))
    period_start_month_num = FR_MONTH_MAP.get(period_start_month_abbr.upper())

    card_match = CARD_NUMBER_RE.search(full_text)
    card_number = card_match.group(1) if card_match else None

    prev_match = PREVIOUS_BALANCE_RE.search(full_text)
    previous_balance = _parse_fr_amount(prev_match.group(1)) if prev_match else None

    total_match = TOTAL_BALANCE_RE.search(full_text)
    total_balance = _parse_fr_amount(total_match.group(1)) if total_match else None

    min_pay_match = MIN_PAYMENT_RE.search(full_text)
    minimum_payment = _parse_fr_amount(min_pay_match.group(1)) if min_pay_match else None

    due_match = DUE_DATE_RE.search(full_text)
    due_date = None
    if due_match:
        due_date = _resolve_date(due_match.group(1), due_match.group(2), int(due_match.group(3)))

    credit_match = CREDIT_LIMIT_RE.search(full_text)
    credit_limit = _parse_fr_amount(credit_match.group(1)) if credit_match else None

    payments_match = PAYMENTS_CREDITS_RE.search(full_text)
    total_payments = _parse_fr_amount(payments_match.group(1)) if payments_match else None

    purchases_match = PURCHASES_DEBITS_RE.search(full_text)
    total_purchases = _parse_fr_amount(purchases_match.group(1)) if purchases_match else None

    interest_match = INTEREST_TOTAL_RE.search(full_text)
    total_interest = _parse_fr_amount(interest_match.group(1)) if interest_match else None

    all_lines = []
    for page_text in pages_text:
        for line in page_text.split('\n'):
            all_lines.append(line.strip())

    transactions = []
    in_transactions = False
    i = 0

    while i < len(all_lines):
        line = all_lines[i]

        if not line or len(line) < 5:
            i += 1
            continue

        if "DESCRIPTION DE L'OP" in line or 'MONTANT ($)' in line:
            in_transactions = True
            i += 1
            continue

        if 'SOLDE DE COMPTE TOTAL' in line:
            in_transactions = False
            i += 1
            continue

        if not in_transactions:
            i += 1
            continue

        if REF_LINE_RE.match(line):
            i += 1
            continue

        tx_match = TX_LINE_RE.match(line)
        if not tx_match:
            i += 1
            continue

        op_day = tx_match.group(1)
        op_month = tx_match.group(2)
        post_day = tx_match.group(3)
        post_month = tx_match.group(4)
        rest = tx_match.group(5).strip()

        op_date = _resolve_date(op_day, op_month, statement_year, period_start_month_num)
        post_date = _resolve_date(post_day, post_month, statement_year, period_start_month_num)
        if not op_date:
            i += 1
            continue

        amount, desc = _extract_amount_from_line(rest)
        if amount is None:
            i += 1
            continue

        desc = re.sub(r'\s+', ' ', desc).strip()

        j = i + 1
        while j < len(all_lines):
            next_line = all_lines[j].strip()
            if not next_line or TX_LINE_RE.match(next_line):
                break
            if REF_LINE_RE.match(next_line):
                j += 1
                continue
            if FR_AMOUNT_RE.search(next_line):
                break
            if next_line.startswith('%') or next_line.startswith('SOLDE') or next_line.startswith('RBC '):
                break
            noise_found = False
            for noise in ['Taux d', 'Avances de fonds', 'BANQUE ROYALE', 'PAIEMENT',
                          'Service à', 'COMMUNIQUEZ', 'Site Web', 'Limite de',
                          'Achats', "Date d'", 'Crédit non', 'CALCUL']:
                if noise in next_line:
                    noise_found = True
                    break
            if noise_found:
                break
            if len(next_line) <= 3:
                break
            desc = desc + ' ' + next_line
            j += 1
            break

        direction = 'payment' if amount < 0 else 'purchase'

        transactions.append({
            'amount': round(abs(amount), 2),
            'description': desc,
            'raw_description': line.strip(),
            'normalized_merchant': desc,
            'date': op_date,
            'posting_date': post_date,
            'time': None,
            'bank': 'rbc_credit',
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

        i += 1

    period_start = _resolve_date(period_start_day, period_start_month_abbr, statement_year)
    period_end = _resolve_date(period_end_day, period_end_month_abbr, statement_year, period_start_month_num)

    return {
        'template': 'rbc_credit',
        'bank': 'rbc_credit',
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
