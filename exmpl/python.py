CONFIG_FILE = os.path.join(os.path.dirname(__file__), "config.yml")
with open(CONFIG_FILE, "r") as f:
    config = yaml.safe_load(f)

def identify_bank(email_sender, email_subject):
    for bank, details in config["banks"].items():
        if details["sender"] == email_sender:
            if any(keyword in email_subject for keyword in details["keywords"]):
                return bank
    return "Unknown"


