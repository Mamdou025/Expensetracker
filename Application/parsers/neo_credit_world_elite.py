try:
    from parsers.neo_base import detect_neo, parse_neo
except ImportError:
    from Application.parsers.neo_base import detect_neo, parse_neo

TEMPLATE_META = {
    'id': 'neo_credit_world_elite',
    'bank': 'Neo Financial World Elite',
    'account_type': 'World Elite Mastercard Credit Card',
    'country': 'Canada',
    'detection_keywords': ['Neo Financial', 'World Elite', 'neofinancial.com'],
    'fields_extracted': [
        'statement_period', 'card_number', 'previous_balance',
        'total_balance', 'minimum_payment', 'due_date',
        'credit_limit', 'total_payments', 'total_purchases',
        'total_interest', 'total_fees',
    ],
    'transaction_fields': ['date', 'posting_date', 'description', 'amount', 'direction'],
    'date_format': 'Mon DD (English, year inferred from statement period)',
    'columns': ['Amount ($CAD)'],
    'notes': 'Neo Financial World Elite Mastercard credit card. Uses PyMuPDF for font-obfuscated PDFs.',
}


def metadata():
    return TEMPLATE_META


def detect(full_text):
    if not detect_neo(full_text):
        return False
    lower = full_text.lower()
    return 'world elite' in lower


def parse(pages_text, document_id=None, filepath=None):
    return parse_neo(pages_text, document_id=document_id, filepath=filepath,
                     template_id='neo_credit_world_elite',
                     bank_label='Neo Financial World Elite')
