import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import traitement

sample_dict = {
    "full_email_html": "<p>COUCHE-TARD # 1319 $3.62</p>",
    "sender": "capitalone@notification.capitalone.com",
    "subject": "A transaction was charged to your account",
    "email_datetime": "Sun, 04 Feb 2025 19:10:00 +0000",
}


def test_extract_from_dict(monkeypatch):
    monkeypatch.setattr(traitement, "is_duplicate", lambda amount, date: False)
    result = traitement.extract_transaction_data(sample_dict)
    assert result["amount"] == "3.62"
    assert result["description"] == "COUCHE-TARD # 1319"
    assert result["date"] == "2025-02-04"
    assert result["bank"] == "capital_one_credit"


def test_unknown_bank(monkeypatch):
    monkeypatch.setattr(traitement, "is_duplicate", lambda amount, date: False)
    data = {
        "full_email_html": "<p>No transaction here</p>",
        "sender": "no-reply@example.com",
        "subject": "Notice",
        "email_datetime": "Mon, 01 Jan 2024 00:00:00 +0000",
    }
    result = traitement.extract_transaction_data(data)
    assert result["bank"] == "Unknown"
    assert result["amount"] is None


def test_neo_credit_multiple_regex(monkeypatch):
    monkeypatch.setattr(traitement, "is_duplicate", lambda amount, date: False)
    email = {
        "full_email_html": "<p>You earned cashback on your purchase of $12.34 at Starbucks</p>",
        "sender": "info@neofinancial.com",
        "subject": "Your purchase at Starbucks",
        "email_datetime": "Mon, 01 Jan 2024 12:00:00 +0000",
        "bank_config": "neo_credit",
    }
    result = traitement.extract_transaction_data(email)
    assert result["bank"] == "neo_credit"
    assert result["amount"] == "12.34"
    assert result["description"] == "Starbucks"
