import os
import sqlite3
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SQLITE_RELATIVE_PATH = Path("Database") / "transactions.db"


def resolve_sqlite_path(raw_path=None):
    candidate = raw_path or os.getenv("SQLITE_PATH")
    if candidate:
        path = Path(candidate).expanduser()
        if not path.is_absolute():
            path = (REPO_ROOT / path).resolve()
    else:
        path = (REPO_ROOT / DEFAULT_SQLITE_RELATIVE_PATH).resolve()

    return path


def get_db_path(raw_path=None):
    return str(resolve_sqlite_path(raw_path))


def ensure_db_directory(raw_path=None):
    resolve_sqlite_path(raw_path).parent.mkdir(parents=True, exist_ok=True)


def connect_db(raw_path=None, **kwargs):
    db_path = resolve_sqlite_path(raw_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(str(db_path), **kwargs)
