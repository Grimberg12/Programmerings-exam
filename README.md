# Programmerings-exam

## Backend

The backend is a simple Express server with a small router structure to support API routes and incoming webhooks.

### Run locally

1. Install dependencies:

   ```powershell
   cd Backend
   npm install
   ```

2. Copy the example env file and set values:

   ```powershell
   cp .env.example .env
   # then edit .env to set any required values
   ```

3. Start the server:

   ```powershell
   npm run dev
   ```

4. Verify the health endpoint:

   ```powershell
   curl http://localhost:3000/health
   ```

### Available endpoints

- `GET /health` - server health check
- `GET /api/v1/ping` - basic API ping
- `POST /webhooks/incoming` - placeholder webhook receiver

## Notes

- The project currently does not connect to a database. A placeholder file is available at `Backend/services/db.js` for wiring up an Azure database connection in the future.
