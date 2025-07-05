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
   PORT=5000  # optional server port
   ```

2. Install Python dependencies (if not already available):
   ```bash
   pip install -r requirements.txt
   ```

3. Install Node dependencies for the frontend and backend:
   ```bash
   cd Client && npm install       # React client
   cd ../Server && npm install    # Express server
   ```

4. Build and run the React client (from the `Client` directory):
   ```bash
   npm start
   ```

5. Start the Express server (from the `Server` directory):
   ```bash
   npm start
   ```
   The server uses the `PORT` environment variable if set, otherwise defaults to `5000`.

6. Run the extraction scripts located in the `Application` folder.

SQLite is the default database. The file is stored at `Database/transactions.db`.

