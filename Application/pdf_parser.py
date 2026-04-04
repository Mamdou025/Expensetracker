import re
import os
import hashlib
import pdfplumber
from datetime import datetime

try:
    from parsers.cibc_chequing import detect as detect_cibc_chequing, parse as parse_cibc_chequing, metadata as meta_cibc_chequing
    from parsers.rbc_credit import detect as detect_rbc_credit, parse as parse_rbc_credit, metadata as meta_rbc_credit
    from parsers.neo_credit import detect as detect_neo_credit, parse as parse_neo_credit, metadata as meta_neo_credit
except ImportError:
    from Application.parsers.cibc_chequing import detect as detect_cibc_chequing, parse as parse_cibc_chequing, metadata as meta_cibc_chequing
    from Application.parsers.rbc_credit import detect as detect_rbc_credit, parse as parse_rbc_credit, metadata as meta_rbc_credit
    from Application.parsers.neo_credit import detect as detect_neo_credit, parse as parse_neo_credit, metadata as meta_neo_credit

TEMPLATE_PARSERS = [
    (detect_cibc_chequing, parse_cibc_chequing, meta_cibc_chequing),
    (detect_rbc_credit, parse_rbc_credit, meta_rbc_credit),
    (detect_neo_credit, parse_neo_credit, meta_neo_credit),
]


def get_all_template_metadata():
    results = []
    for _detect_fn, _parse_fn, meta_fn in TEMPLATE_PARSERS:
        results.append(meta_fn())
    return results


DATE_PATTERNS = [
    (re.compile(r'(\d{4}[-/]\d{2}[-/]\d{2})'), '%Y-%m-%d'),
    (re.compile(r'(\d{4}[-/]\d{2}[-/]\d{2})'), '%Y/%m/%d'),
    (re.compile(r'(\d{2}[-/]\d{2}[-/]\d{4})'), '%m-%d-%Y'),
    (re.compile(r'(\d{2}[-/]\d{2}[-/]\d{4})'), '%m/%d/%Y'),
    (re.compile(r'(\d{2}[-/]\d{2}[-/]\d{4})'), '%d-%m-%Y'),
    (re.compile(r'(\d{2}[-/]\d{2}[-/]\d{4})'), '%d/%m/%Y'),
    (re.compile(r'([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4})'), '%b %d, %Y'),
    (re.compile(r'([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4})'), '%b %d %Y'),
    (re.compile(r'(\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4})'), '%d %b %Y'),
]

AMOUNT_PATTERN = re.compile(
    r'(?<!\d)'
    r'(-?\$?\s*\d{1,3}(?:[, ]\d{3})*(?:\.\d{1,2})?)'
    r'\$?'
    r'(?!\d)'
)

SKIP_PATTERNS = [
    re.compile(r'(?i)\b(?:balance|solde|total|opening|closing|previous|page|statement)\b'),
    re.compile(r'(?i)\b(?:credit limit|available credit|minimum payment|date de)\b'),
    re.compile(r'^\s*$'),
]


def _compute_document_id(filepath, file_bytes=None):
    if file_bytes:
        h = hashlib.sha256(file_bytes).hexdigest()[:16]
    else:
        h = hashlib.sha256(filepath.encode()).hexdigest()[:16]
    basename = os.path.basename(filepath)
    return f"pdf:{basename}:{h}"


def _parse_date(text):
    for pattern, fmt in DATE_PATTERNS:
        m = pattern.search(text)
        if m:
            raw = m.group(1)
            for try_fmt in [fmt, fmt.replace('-', '/'), fmt.replace('/', '-')]:
                try:
                    dt = datetime.strptime(raw, try_fmt)
                    return dt.strftime('%Y-%m-%d'), m.start(), m.end()
                except ValueError:
                    continue
    return None, None, None


def _parse_amounts(text):
    matches = []
    for m in AMOUNT_PATTERN.finditer(text):
        raw = m.group(1).replace(',', '').replace(' ', '').replace('$', '')
        try:
            val = float(raw)
            if 0.01 <= abs(val) <= 999999.99:
                matches.append((val, m.start(), m.end()))
        except ValueError:
            continue
    return matches


def _should_skip(line):
    for pat in SKIP_PATTERNS:
        if pat.search(line):
            return True
    return False


def _extract_description(line, date_end, amount_start):
    segment = line[date_end:amount_start].strip()
    segment = re.sub(r'\s+', ' ', segment)
    segment = segment.strip(' -–—')
    return segment if len(segment) >= 2 else None


def _detect_bank(full_text):
    text_lower = full_text.lower()
    if 'cibc' in text_lower:
        return 'CIBC'
    if 'capital one' in text_lower or 'capitalone' in text_lower:
        return 'Capital One'
    if 'mbna' in text_lower:
        return 'MBNA'
    if 'neo financial' in text_lower or 'neofinancial' in text_lower:
        return 'Neo Financial'
    if 'td canada' in text_lower or 'td bank' in text_lower:
        return 'TD'
    if 'rbc' in text_lower or 'royal bank' in text_lower:
        return 'RBC'
    if 'scotiabank' in text_lower or 'scotia' in text_lower:
        return 'Scotiabank'
    if 'bmo' in text_lower or 'bank of montreal' in text_lower:
        return 'BMO'
    if 'desjardins' in text_lower:
        return 'Desjardins'
    if 'tangerine' in text_lower:
        return 'Tangerine'
    return 'Unknown'


def _detect_card_type(full_text):
    text_lower = full_text.lower()
    if 'credit' in text_lower:
        return 'Credit'
    if 'chequing' in text_lower or 'checking' in text_lower or 'debit' in text_lower:
        return 'Debit'
    return 'Unknown'


def parse_pdf_statement(filepath):
    with open(filepath, 'rb') as f:
        file_bytes = f.read()

    document_id = _compute_document_id(filepath, file_bytes)
    with pdfplumber.open(filepath) as pdf:
        full_text = ""
        pages_text = []
        page_lines = []

        for page in pdf.pages:
            text = page.extract_text() or ""
            full_text += text + "\n"
            pages_text.append(text)
            for line in text.split('\n'):
                page_lines.append(line.strip())

    for detect_fn, parse_fn, _meta_fn in TEMPLATE_PARSERS:
        if detect_fn(full_text):
            result = parse_fn(pages_text, document_id=document_id, filepath=filepath)
            if result and result.get('transactions_found', 0) > 0:
                result['document_id'] = document_id
                result['total_pages'] = len(pages_text)
                return result

    bank = _detect_bank(full_text)
    card_type = _detect_card_type(full_text)
    transactions = []
    seen_keys = set()

    for line in page_lines:
        if not line or len(line) < 10:
            continue
        if _should_skip(line):
            continue

        date_str, date_start, date_end = _parse_date(line)
        if not date_str:
            continue

        amounts = _parse_amounts(line)
        if not amounts:
            continue

        best_amount = amounts[-1]
        amount_val, amount_start, amount_end = best_amount

        desc = _extract_description(line, date_end, amount_start)
        if not desc:
            for amt_val, amt_start, amt_end in amounts:
                desc = _extract_description(line, date_end, amt_start)
                if desc:
                    amount_val = amt_val
                    break

        if not desc:
            continue

        dedup_key = f"{date_str}|{desc}|{amount_val}"
        if dedup_key in seen_keys:
            continue
        seen_keys.add(dedup_key)

        transactions.append({
            "amount": round(amount_val, 2),
            "description": desc,
            "raw_description": line.strip(),
            "normalized_merchant": desc,
            "date": date_str,
            "time": None,
            "bank": bank,
            "card_type": card_type,
            "category": "Uncategorized",
            "tags": [],
            "source_type": "pdf",
            "source_ref": document_id,
            "duplicate_status": "unchecked",
            "duplicate_group_id": None,
            "full_email": None,
        })

    return {
        "document_id": document_id,
        "bank": bank,
        "card_type": card_type,
        "total_pages": len(page_lines),
        "transactions_found": len(transactions),
        "transactions": transactions,
    }
