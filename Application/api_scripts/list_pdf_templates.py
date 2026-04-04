import sys
import os
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from pdf_parser import get_all_template_metadata

if __name__ == '__main__':
    templates = get_all_template_metadata()
    print(json.dumps(templates))
