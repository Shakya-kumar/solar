# Production Architecture

The current production architecture is maintained in:

```txt
docs/PRODUCTION_FORM_SYSTEM.md
```

Summary:

```txt
Cloudflare Pages frontend
  -> /api/submit
  -> Cloudflare Worker
  -> Google Apps Script
  -> Google Sheets tabs: Quotes, ROI, Messages, Services
```
