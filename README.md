# AI Lead Outreach

AI Lead Outreach is a responsive React + TypeScript workspace for human-in-the-loop lead discovery and Gmail outreach. The frontend keeps the workflow explicit: **Find leads → Review leads → Generate AI email → Edit → Confirm → Send**.

## Local setup

Install dependencies with `pnpm install`, then copy `.env.example` to `.env.local` and set the n8n configuration. Start the development server with `pnpm dev`. The app is also type-checkable with `pnpm check` and buildable with `pnpm build`.

## Environment configuration

The current project is a static frontend, so the browser reads `VITE_N8N_BASE_URL` and `VITE_N8N_API_KEY` at build time. The key is never hardcoded in components, stored in localStorage, or displayed in the UI. For a production deployment where the API key must remain fully server-side, upgrade the project to a full-stack architecture and proxy these four calls through a server route. Do not commit `.env.local` or any file containing the real key.

## n8n API

The API client is centralized in `client/src/lib/api.ts`. It communicates only with the four supplied webhook endpoints and sends `X-API-KEY` when configured.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/start-scraper` | Preferred direct entry point for the long-running lead discovery workflow. |
| `POST` | `/run-scraper` | Alternative entry point through the API workflow. |
| `GET` | `/leads` | Loads the latest extracted leads. |
| `POST` | `/generate-email` | Generates a personalized draft from the complete selected lead object. |
| `POST` | `/send-email` | Sends the currently edited email after explicit confirmation. |

The default base URL is `https://deepashu.app.n8n.cloud/webhook`. The frontend does not call Gmail, Apify, OpenRouter, Google Sheets, or any other backend service directly.

## Workflow behavior

The dashboard loads leads on entry and supports local search, email filtering, location filtering, sorting, detail review, and responsive mobile cards. Starting a scraper calls the preferred direct `/start-scraper` endpoint, disables duplicate execution, communicates that the workflow may take time, waits for completion, then reloads leads. Email generation opens an editor only after a successful response. Recipient, subject, and body are editable; the recipient is validated before send. A mandatory confirmation dialog appears before `/send-email`, and only a successful response marks the lead as contacted and adds it to current-session sent history.

The Outreach and Sent pages intentionally use frontend session state only. They do not imply persistent database history.

## Security considerations

Never expose Gmail credentials, n8n internals, stack traces, or the API key in the interface. Do not place the key in source control or localStorage. The static build cannot make a secret truly server-side; use the documented full-stack proxy approach for production secret isolation.
