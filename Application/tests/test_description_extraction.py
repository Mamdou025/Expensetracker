import os
import sys

# Ensure Application modules can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from traitement import extract_transaction_data


def _extract(bank_key: str, html: str):
    data = {"bank_config": bank_key, "full_email_html": html}
    return extract_transaction_data(data)


def test_capital_one_mixed_case_description():
    result = _extract("capital_one_credit", "MixedCaseVendor $10.00")
    assert result["description"] == "MixedCaseVendor"


def test_mbna_mixed_case_description():
    result = _extract("mbna_credit", "You made a purchase of $9.99 from MixedCaseVendor")
    assert result["description"] == "MixedCaseVendor"


def test_cibc_debit_mixed_case_description():
    html = "Montant de l'achat : 25,99$\nLieu de l'achat : MixedCaseStore\n"
    result = _extract("cibc_debit", html)
    assert result["description"] == "MixedCaseStore"


def test_cibc_credit_mixed_case_description():
    html = "achat de $12.34 MixedCaseVendor avec votre carte"
    result = _extract("cibc_credit", html)
    assert result["description"] == "MixedCaseVendor"


def test_neo_credit_mixed_case_description():
    html = "You made a purchase of $5.55 at MixedCaseStore"
    result = _extract("neo_credit", html)
    assert result["description"] == "MixedCaseStore"



def test_plain_text_input_does_not_raise_and_preserves_full_email():
    result = extract_transaction_data("No structured html", email_sender="unknown@example.com", email_subject="No match")
    assert result["full_email"] == "No structured html"


def test_exclude_keywords_block_transaction_parsing():
    cfg = {
        "banks": {
            "capital_one_credit": {
                "sender": "capitalone@notification.capitalone.com",
                "keywords": ["A transaction was charged to your account"],
                "exclude_keywords": ["Payment posted"],
                "regex": {
                    "amount": "\\$?([0-9]+[,.][0-9]{2})\\$?",
                    "description": "([A-Za-z0-9#&\\- ]+)(?=\\s*\\$?[0-9]+[,.][0-9]{2}\\$?)"
                }
            }
        }
    }

    email_data = {
        "sender": "capitalone@notification.capitalone.com",
        "subject": "Payment posted to your account",
        "full_email_html": "StoreName $10.00",
        "bank_config": "capital_one_credit"
    }

    result = extract_transaction_data(email_data, cfg=cfg)
    assert result["amount"] is None
    assert result["description"] is None
    assert result["bank"] == "Unknown"
