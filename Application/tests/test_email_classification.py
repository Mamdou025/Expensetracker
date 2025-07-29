import os
import sys
# Ensure Application modules can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from Realtransactions import load_config, is_transaction_email


def test_exclude_keyword_blocks_transaction():
    config = load_config()
    sender = config["banks"]["capital_one_credit"]["sender"]
    subject = "Payment posted to your account"
    content = "Thank you for your payment of $50."

    assert is_transaction_email(sender, subject, content, config) == (False, None, None)


def test_positive_keyword_still_detected():
    config = load_config()
    sender = config["banks"]["capital_one_credit"]["sender"]
    subject = "A transaction was charged to your account"
    content = "Purchase of $10 at STORE"

    result = is_transaction_email(sender, subject, content, config)
    assert result[0] is True
    assert result[1] == "capital_one_credit"

