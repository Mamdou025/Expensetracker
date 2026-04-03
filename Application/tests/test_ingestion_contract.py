import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from traitement import extract_transaction_data
from api_scripts import process_queue
from Database.Insert import normalize_tags


def test_extract_transaction_contract_uses_card_type_and_source_metadata():
    result = extract_transaction_data(
        {
            "sender": "capitalone@notification.capitalone.com",
            "subject": "A transaction was charged to your account",
            "email_datetime": "Fri, 03 Apr 2026 12:00:00 +0000",
            "bank_config": "capital_one_credit",
            "full_email_html": "Store Name $10.00",
        }
    )

    assert "card_type" in result
    assert result["card_type"] == "credit card"
    assert result["card type"] == result["card_type"]  # legacy alias
    assert result["source_type"] == "email"
    assert isinstance(result["source_ref"], str)
    assert isinstance(result["tags"], list)


def test_process_queue_reuses_preview_transaction_when_present():
    queue_item = {
        "email": {
            "sender": "sender@example.com",
            "subject": "Subject",
            "email_datetime": "Fri, 03 Apr 2026 12:00:00 +0000",
            "full_email_html": "ignored",
        },
        "transaction": {
            "amount": "41.11",
            "description": "Preview Vendor",
            "card_type": "credit card",
            "date": "2026-04-03",
            "bank": "capital_one_credit",
            "full_email": "preview copy",
        },
    }

    normalized = process_queue._normalize_queue_item(queue_item)

    assert normalized["amount"] == "41.11"
    assert normalized["description"] == "Preview Vendor"
    assert normalized["full_email"] == "preview copy"
    assert normalized["source_type"] == "email"
    assert isinstance(normalized["tags"], list)


def test_normalize_tags_accepts_csv_and_arrays():
    assert normalize_tags("food, transport , food") == ["food", "transport"]
    assert normalize_tags(["one, two", "two", "three"]) == ["one", "two", "three"]
