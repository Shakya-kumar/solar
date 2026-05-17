# Launch Checklist

## Prerequisites

- Node.js 18+
- Cloudflare account and Pages project
- Google Apps Script Web App deployed as **Anyone**
- `backend/backend.gs` pasted into the Apps Script editor

## Local Setup

1. Copy `.dev.vars.example` to `.dev.vars`.
2. Set `APPS_SCRIPT_URL` to the live Apps Script Web App URL ending in `/exec`.
3. Run `npm install`.

## Run Locally

```bash
npm run dev
```

- Open the URL Wrangler prints, normally `http://127.0.0.1:8788`.
- `GET /api/health` must return JSON with `success: true`.
- Open `/quotation` or `/quotation.html`, complete steps 1 to 4, download the PDF, and confirm the save banner reports success.

## Production

1. In the Cloudflare Pages project, add secret `APPS_SCRIPT_URL`.
2. Keep `VSS_API_ENDPOINT=/api/submit`.
3. Set build command to `npm run build`.
4. Set output directory to `dist`.
5. Deploy with `npm run deploy` or through the Cloudflare dashboard.

## Verify

| Check | Expected |
| --- | --- |
| `/api/health` | JSON 200 |
| Contact form | Row in `Messages` and `Submission_Log` |
| Service form | Row in `Services` and `Submission_Log` |
| ROI report | PDF downloads and row in `ROI` |
| Quotation flow | PDF downloads and row in `Quotes` |

See `docs/PRODUCTION_FORM_ARCHITECTURE.md` for debugging details.
