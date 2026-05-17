# Deployment Guide

Use the complete deployment steps in:

```txt
docs/PRODUCTION_FORM_SYSTEM.md
```

**Architecture overview (multi-form, Sheets, debugging):** `docs/PRODUCTION_FORM_ARCHITECTURE.md`

**Local run + deploy checklist:** `docs/LAUNCH.md`

Deployment order:

```txt
1. Google Apps Script backend
2. Cloudflare Worker /api/submit
3. Cloudflare Pages frontend
4. End-to-end form test
```
