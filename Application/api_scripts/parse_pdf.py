import sys
import os
import json

current_dir = os.path.dirname(__file__)
sys.path.append(os.path.abspath(os.path.join(current_dir, '..')))
sys.path.append(os.path.abspath(os.path.join(current_dir, '..', '..')))

from pdf_parser import parse_pdf_statement


def main():
    raw = sys.stdin.read().strip()
    if not raw:
        print(json.dumps({"error": "no input provided"}))
        return

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        print(json.dumps({"error": "invalid JSON input"}))
        return

    filepath = payload.get("filepath")
    if not filepath or not os.path.isfile(filepath):
        print(json.dumps({"error": f"file not found: {filepath}"}))
        return

    try:
        result = parse_pdf_statement(filepath)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))


if __name__ == '__main__':
    main()
