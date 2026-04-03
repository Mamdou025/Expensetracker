import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from extracteur import _imap_before_date_inclusive, _load_email_credentials


def test_imap_end_date_is_inclusive_by_advancing_before_date():
    assert _imap_before_date_inclusive('31-Dec-2025') == '01-Jan-2026'


def test_credentials_require_env_vars_by_default(monkeypatch):
    monkeypatch.delenv('EMAIL_USER', raising=False)
    monkeypatch.delenv('EMAIL_PASS', raising=False)
    monkeypatch.delenv('ALLOW_PLAINTEXT_CREDENTIALS', raising=False)

    try:
        _load_email_credentials()
    except ValueError as exc:
        assert 'EMAIL_USER and EMAIL_PASS' in str(exc)
    else:
        raise AssertionError('Expected ValueError when EMAIL_USER/EMAIL_PASS are missing')


def test_credentials_loaded_from_env(monkeypatch):
    monkeypatch.setenv('EMAIL_USER', 'user@example.com')
    monkeypatch.setenv('EMAIL_PASS', 'secret')
    monkeypatch.delenv('ALLOW_PLAINTEXT_CREDENTIALS', raising=False)

    user, password = _load_email_credentials()
    assert user == 'user@example.com'
    assert password == 'secret'
