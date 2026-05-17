# Audit and Deployment

The production form architecture is documented in:

```txt
docs/PRODUCTION_FORM_SYSTEM.md
```

Key audit outcome: the frontend must call only `/api/submit`; the Apps Script URL belongs only in the Cloudflare Worker secret `APPS_SCRIPT_URL`.
