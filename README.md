# Vaibhav Solar Solution

Static Cloudflare Pages website with a production form pipeline:

```txt
Browser -> Cloudflare Worker /api/submit -> Google Apps Script -> Google Sheets
```

The browser never calls Google Apps Script directly. The Apps Script URL must be stored only as the Pages Function/Worker secret `APPS_SCRIPT_URL`.

## Deploy

1. Paste `backend/backend.gs` into the Google Sheet Apps Script project.
2. Set `SPREADSHEET_ID` in the script and deploy it as a Web App.
3. In the Cloudflare Pages project, set secret `APPS_SCRIPT_URL`.
4. Run `npm run build`.
5. Deploy `dist` with `npm run deploy` or connect the repo in Cloudflare Pages.

Full production guide:

```txt
docs/PRODUCTION_FORM_SYSTEM.md
```

## Local Checks

```bash
npm run build
node --check app-config.js
node --check workers/worker.js
node --check api-client.js
```
