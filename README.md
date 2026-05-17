<<<<<<< HEAD
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
=======
# Vaibhav Solar Solutions

Static Cloudflare Pages website for Vaibhav Solar Solutions with quotation, ROI calculator, browser PDF downloads, and automatic EmailJS delivery.

## Project Structure

- `index.html`, `about.html`, `services.html`, `contact.html`, `faq.html`: static Pages routes
- `calculator.html`: ROI calculator page
- `quotation.html`: quotation wizard page
- `style.css`: shared styling
- `email.js`: reusable EmailJS delivery helper
- `roi.js`: ROI logic and browser PDF download with automatic email delivery
- `script.js`: quotation logic and browser PDF download with automatic email delivery
- `contact.js`: contact and service form capture with EmailJS deliver
- `nav.js`, `services.js`: frontend helpers
- `vendor/html2canvas.min.js`, `vendor/jspdf.umd.min.js`: local browser PDF libraries
- `_redirects`: static page fallback

PDF generation is handled in the browser with local `html2canvas` and `jsPDF` assets. Email delivery is attempted through EmailJS first, with Web3Forms and Formspree fallback options if EmailJS fails or is not configured.

## Email Setup

### EmailJS (primary)

1. Create an EmailJS account at https://www.emailjs.com.
2. Add your email service and create a template.
3. Set these constants in `email.js`:
   - `EMAILJS_SERVICE_ID`
   - `EMAILJS_TEMPLATE_ID`
   - `EMAILJS_PUBLIC_KEY`
4. Use a template with fields such as:
   - `customer_name`
   - `customer_email`
   - `customer_phone`
   - `customer_location`
   - `customer_address`
   - `customer_message`
   - `request_type`
   - `action_type`
   - `service_type`
   - `roi_details`
   - `quote_details`
   - `timestamp`

### Web3Forms fallback

If EmailJS fails or is unavailable, the site can fall back to Web3Forms.

1. Create a Web3Forms account at https://web3forms.com.
2. Get your `ACCESS_KEY`.
3. Set `WEB3FORMS_ACCESS_KEY` in `email.js`.
4. Set `WEB3FORMS_TO_EMAIL` to the email address that should receive the notifications.

### Optional Formspree fallback

If EmailJS and Web3Forms are not configured or unavailable, the site can use Formspree as an additional fallback.

1. Create a Formspree form at https://formspree.io.
2. Copy the `FORM_ID` from your form endpoint.
3. Set `FORMSPREE_FORM_ID` in `email.js`.
4. The client-side script will automatically use Formspree when the other providers are unavailable.

This ensures quotation downloads, ROI downloads, and all form submissions still attempt delivery automatically without breaking UI or functionality.

## Deploy to Cloudflare Pages

Use these build settings:

```text
Build command: none
Build output directory: /
```

Then deploy:

```powershell
wrangler pages deploy . --project-name vaibhav-solar-solutions
```

## Local Testing

Open the HTML files directly in a browser or use any static server.

## Cloudflare Compatibility Notes

- The site is fully static and works on Cloudflare Pages.
- No server-side backend or Pages Functions are required for email delivery.
- Email delivery is handled client-side through EmailJS.
- Browser PDF downloads and form submissions both work automatically without extra user input.
>>>>>>> 81f5cb3012d451a619506ecba522b329391da7eb
