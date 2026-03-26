# Copilot Instructions for Programmerings-exam

## Overview
- Full-stack minimal project.
- Backend: Express server in `Backend/server.js`.
- Frontend: static HTML/CSS/JS in `Frontend/public`, plus layout snippets in `Frontend/layout`.
- No DB currently wired, but placeholder in `Backend/services/db.js`.

## Architecture and flow
- `Backend/server.js` sets up:
  - static file serving from `../Frontend/public`
  - JSON and URL-encoded body parsing
  - health check: `GET /health`
  - API routes: mounted at `/api/v1` using `Backend/routes/api.js` (eg `GET /api/v1/ping`, `GET /api/v1/status`)
  - webhook routes: mounted at `/webhooks` with `Backend/routes/webhooks.js` → `Backend/controllers/webhookController.js`
  - 404 handler + global error handler with JSON output
- The frontend is purely static; routing is file-based (e.g. `Frontend/public/login.html`).

## Important files
- `Backend/server.js`: main entrypoint; call with `npm run dev` from `Backend`.
- `Backend/routes/api.js`: express router export `default` (ES module syntax) and endpoints.
- `Backend/routes/webhooks.js`: uses `require` (CommonJS) and links controller.
- `Backend/controllers/webhookController.js`: stub that logs payload and returns `{ok:true}`.
- `Backend/services/db.js`: not implemented; future SQL connection point.
- `Frontend/public/`: static content for user flows (index, login, register, compare, case, terms).
- `Frontend/js/register.js`: likely form handling; inspect if connected to backend.

## Run / debug workflow
1. `cd Backend`
2. `npm install`
3. `cp .env.example .env` (if needed)
4. `npm run dev` (reads `PORT` default 3000)
5. open `http://localhost:3000`.
6. use `curl http://localhost:3000/health` to verify.

## Project-specific conventions
- mix of CommonJS and ESM in backend routing (`require` in webhooks, `import` in api router). Keep this in mind when adding modules.
- No test harness is present.
- Responses are standard JSON objects (`{ok: true,...}`), and errors are centralized in middleware.

## Extension points and gotchas
- Webhook endpoint path: `POST /webhooks/incoming` in `webhookController.handleIncomingWebhook`.
- Static route endpoints are in `Frontend/public` directories, served directly by Express static.
- If you add a DB connection, follow pattern in `Backend/services/db.js` and call `connect()` before route handlers.
- Keep versioned API prefix (`/api/v1`) always behind this mount for new endpoints.

## AI agent behavior guidance
- Do not assume any authentication is implemented; any endpoint in code is currently open.
- When adding endpoints ensure they are wired both in `Backend/server.js` and in the relevant router file.
- Avoid adding server-side dependencies unless anchored in `Backend/package.json` and documented in README.
- Keep minimal environment usage: only `PORT`, optional `AZURE_SQL_CONNECTION_STRING` for future efforts.

## Suggested follow-up question for developer
- "Should new Backend API endpoints use ESM in all router files, or keep the existing mixed CJS/ESM style?"
