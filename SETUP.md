# Setup

Use `docs/PRODUCTION_FORM_SYSTEM.md` as the source of truth.

Important current values:

```txt
Frontend endpoint: /api/submit
Worker secret: APPS_SCRIPT_URL
Google Sheet tabs: Quotes, ROI, Messages, Services, Submission_Log, Error_Log
```

Do not put the Google Apps Script URL in Cloudflare Pages variables or browser JavaScript.
