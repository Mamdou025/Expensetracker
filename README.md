# ExpenseTracker

This project extracts transaction data from emails and stores it in a local SQLite database.

Make sure **Python 3** is installed and accessible from your command line. Some platforms expose the interpreter as `python3` instead of `python`. You can set a `PYTHON_CMD` environment variable pointing to the correct command if needed.

## Setup

1. **Provide email credentials** used by the extraction scripts.
   - Either edit `credentials.yml` with your email address and app password.
   - Or set the environment variables `EMAIL_USER` and `EMAIL_PASS`. A `.env` file can be used with tools such as `python-dotenv`.
   The scripts read environment variables first and fall back to `credentials.yml` if they are not set.
   If you store real credentials in the file, consider adding `credentials.yml` to `.gitignore` to avoid committing secrets.
   Example `.env` file:
   ```
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_app_password
   ```
2. Install Python dependencies (if not already available) using `pip`:
   ```bash
   pip install -r requirements.txt
   # use `pip3` if your system separates Python 2 and 3
   ```
3. Run the extraction scripts located in the `Application` folder using Python 3:
   ```bash
   ${PYTHON_CMD:-python} Application/main.py
   ```
   Replace `main.py` with whichever script you want to execute. Set `PYTHON_CMD` if `python` does not point to Python 3 on your system.


## Running the React client and Node server

The web interface lives in the `client` folder while the API server resides in `Server`.

### Installing dependencies
1. **Client**
   ```bash
   cd client
   npm install --legacy-peer-deps
   # or install TypeScript 4.9 manually if you prefer
   npm install typescript@4.9 --save-dev
   ```
   Run `npm install` within `client/` before `npm test`.
2. **Server**
   ```bash
   cd Server
   npm install
   ```

### Starting the services
Start the React development server:
```bash
cd client
npm start
```

Start the Node API server (runs on port 5000 by default):
```bash
cd Server
node Server.js
```

The React app reads `REACT_APP_API_URL` to determine the API base URL (defaults to `http://localhost:5000`).
You can place this variable in a `.env` file inside the `client` folder.
The Node server uses the optional `PORT` environment variable and reads the SQLite
`transactions.db` from the `Database` directory.

## Database schema upgrades
If you update the project and new columns are added (for example the
`category` field), run the database creation script again:

```bash
python Database/Database.py
```
This will alter the existing database tables to include any missing columns.

