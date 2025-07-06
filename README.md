# ExpenseTracker

This project extracts transaction data from emails and stores it in a local SQLite database.

## Setup

1. **Provide email credentials** used by the extraction scripts.
   - Either edit `credentials.yml` with your Gmail address and app password.
   - Or set the environment variables `EMAIL_USER` and `EMAIL_PASS`. A `.env` file can be used with tools such as `python-dotenv`.
   Example `.env` file:
   ```
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_app_password
   ```
2. Install Python dependencies (if not already available):
   ```bash
   pip install -r requirements.txt
   ```
3. Run the extraction scripts located in the `Application` folder.

