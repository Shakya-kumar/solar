/**
 * Google Apps Script backend for Cloudflare Worker form submissions.
 *
 * Sheet tabs used by this system:
 * - Quotes
 * - ROI
 * - Messages
 * - Services
 * - Submission_Log
 * - Error_Log
 *
 * Deploy as Web App:
 * Execute as: Me
 * Who has access: Anyone
 */

const SPREADSHEET_ID = '1yWQviNzWPYquslDzBBPubExbTcbUkg9u5Y3gHK6534A';
const ADMIN_EMAIL = '';
const SCRIPT_VERSION = '2026-05-14-v2';

const SHEETS = {
  quotation: {
    tab: 'Quotes',
    idPrefix: 'VSQ',
    headers: [
      'Timestamp', 'Request_ID', 'Quote_ID', 'Name', 'Phone', 'Email', 'Address', 'City', 'State', 'Pincode',
      'Property_Type', 'Roof_Type', 'Plant_Size', 'Solar_Panel', 'Inverter', 'Battery', 'Structure_Type',
      'Subsidy', 'Total_Cost', 'Net_Payable', 'Monthly_Bill', 'Monthly_Savings', 'ROI_Years',
      'Payback_Period', 'Installation_Type', 'PDF_Name', 'PDF_Status', 'Source_Page', 'Source_URL',
      'User_Agent', 'Raw_JSON'
    ]
  },
  roi: {
    tab: 'ROI',
    idPrefix: 'ROI',
    headers: [
      'Timestamp', 'Request_ID', 'Lead_ID', 'Name', 'Phone', 'Email', 'City', 'State',
      'Monthly_Electricity_Bill', 'Roof_Area', 'Recommended_Plant', 'Estimated_Cost',
      'Estimated_Savings', 'ROI', 'Payback', 'Source_Page', 'Source_URL', 'User_Agent', 'Raw_JSON'
    ]
  },
  contact: {
    tab: 'Messages',
    idPrefix: 'MSG',
    headers: [
      'Timestamp', 'Request_ID', 'Message_ID', 'Name', 'Phone', 'Email', 'Subject', 'Message',
      'Source_Page', 'Source_URL', 'User_Agent', 'Raw_JSON'
    ]
  },
  services: {
    tab: 'Services',
    idPrefix: 'SRV',
    headers: [
      'Timestamp', 'Request_ID', 'Service_ID', 'Name', 'Phone', 'Email', 'Address', 'City',
      'Service_Type', 'Issue_Description', 'Preferred_Visit_Date', 'Source_Page', 'Source_URL',
      'User_Agent', 'Raw_JSON'
    ]
  },
  submissionLog: {
    tab: 'Submission_Log',
    headers: ['Timestamp', 'Request_ID', 'Form_Type', 'Record_ID', 'Status', 'Response_Time_ms', 'Message']
  },
  errorLog: {
    tab: 'Error_Log',
    headers: ['Timestamp', 'Request_ID', 'Form_Type', 'Error_Code', 'Error_Message', 'Stack', 'Raw_JSON']
  }
};

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || '').toLowerCase();
  if (action === 'setup') return setupSheets();
  if (action === 'health') {
    return jsonResponse({
      success: true,
      status: 'ok',
      version: SCRIPT_VERSION,
      timestamp: new Date().toISOString()
    });
  }

  return jsonResponse({
    success: true,
    service: 'Vaibhav Solar Sheets backend',
    version: SCRIPT_VERSION,
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  const startedAt = Date.now();
  let payload = null;
  let requestId = '';
  let formType = '';

  try {
    payload = parsePayload(e);
    requestId = text(payload.requestId) || createId('REQ');
    formType = normalizeFormType(payload.formType || payload.type);

    if (!SHEETS[formType]) {
      throw appError('UNKNOWN_FORM_TYPE', 'Unknown form type: ' + formType);
    }

    const data = normalizeData(formType, payload.data || payload);
    validateData(formType, data);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      ensureSheets();

      const existing = findExistingRequest(formType, requestId);
      if (existing) {
        const ms = Date.now() - startedAt;
        logSubmission(requestId, formType, existing.recordId, 'duplicate', ms, 'Idempotent retry returned existing record.');
        return jsonResponse({
          success: true,
          duplicate: true,
          recordId: existing.recordId,
          message: 'Submission already saved.',
          responseTimeMs: ms
        });
      }

      const recordId = data.quoteId || data.leadId || data.messageId || data.requestId || createId(SHEETS[formType].idPrefix);
      const row = buildRow(formType, payload, data, requestId, recordId);
      getSheet(formType).appendRow(row);

      const ms = Date.now() - startedAt;
      logSubmission(requestId, formType, recordId, 'success', ms, 'Saved to ' + SHEETS[formType].tab);
      maybeNotify(formType, data, recordId);

      return jsonResponse({
        success: true,
        duplicate: false,
        recordId: recordId,
        message: 'Submission saved successfully.',
        responseTimeMs: ms
      });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    const ms = Date.now() - startedAt;
    requestId = requestId || createId('REQ');
    formType = formType || 'unknown';

    logError(requestId, formType, error.code || 'PROCESSING_ERROR', error.message, error.stack, payload);
    logSubmission(requestId, formType, '', 'error', ms, error.message);

    return jsonResponse({
      success: false,
      error: {
        code: error.code || 'PROCESSING_ERROR',
        message: error.message || 'Unable to save submission.'
      },
      responseTimeMs: ms
    });
  }
}

function setupSheets() {
  ensureSheets();
  return jsonResponse({
    success: true,
    message: 'Sheets are ready.',
    tabs: ['Quotes', 'ROI', 'Messages', 'Services', 'Submission_Log', 'Error_Log']
  });
}

function ensureSheets() {
  Object.keys(SHEETS).forEach(function (key) {
    const config = SHEETS[key];
    const sheet = getOrCreateSheet(config.tab);
    const width = config.headers.length;
    const current = sheet.getLastRow() ? sheet.getRange(1, 1, 1, width).getValues()[0] : [];
    const needsHeaders = current.join('|') !== config.headers.join('|');

    if (needsHeaders) {
      sheet.getRange(1, 1, 1, width).setValues([config.headers]);
      sheet.setFrozenRows(1);
      sheet.autoResizeColumns(1, width);
    }
  });
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw appError('EMPTY_BODY', 'Request body is empty.');
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw appError('INVALID_JSON', 'Request body must be valid JSON.');
  }
}

function normalizeFormType(type) {
  const value = text(type).toLowerCase();
  if (value === 'quotation' || value === 'quote') return 'quotation';
  if (value === 'roi' || value === 'roi_lead') return 'roi';
  if (value === 'contact' || value === 'messages') return 'contact';
  if (value === 'services' || value === 'service') return 'services';
  if (value.indexOf('quot') !== -1) return 'quotation';
  if (value.indexOf('roi') !== -1) return 'roi';
  if (value.indexOf('contact') !== -1 || value.indexOf('message') !== -1) return 'contact';
  if (value.indexOf('service') !== -1 || value.indexOf('support') !== -1) return 'services';
  return value;
}

function normalizeData(formType, data) {
  const d = data || {};

  if (formType === 'quotation') {
    d.name = text(d.name || d.fullName || d.customerName);
    d.phone = normalizePhone(d.phone);
    d.plantSize = text(d.plantSize || d.plantLabel);
  }

  if (formType === 'roi') {
    d.name = text(d.name || d.customerName);
    d.phone = normalizePhone(d.phone || d.customerPhone);
    d.monthlyElectricityBill = text(d.monthlyElectricityBill || d.monthlyBill || d.bill);
  }

  if (formType === 'contact') {
    d.name = text(d.name);
    d.phone = normalizePhone(d.phone);
    d.message = text(d.message || d.problemDescription);
  }

  if (formType === 'services') {
    d.name = text(d.name);
    d.phone = normalizePhone(d.phone);
    d.serviceType = text(d.serviceType || d.problem || 'Service inquiry');
    d.issueDescription = text(d.issueDescription || d.description || d.message || d.problem);
  }

  return d;
}

function validateData(formType, data) {
  const required = {
    quotation: ['name', 'phone', 'plantSize'],
    roi: ['name', 'phone', 'monthlyElectricityBill'],
    contact: ['name', 'phone', 'message'],
    services: ['name', 'phone', 'issueDescription']
  }[formType];

  const missing = required.filter(function (field) {
    return !text(data[field]);
  });

  if (missing.length) {
    throw appError('VALIDATION_FAILED', 'Missing required field(s): ' + missing.join(', '));
  }
}

function buildRow(formType, payload, data, requestId, recordId) {
  const now = new Date();
  const rawJson = safeStringify(payload);

  if (formType === 'quotation') {
    return [
      now, requestId, recordId, data.name, data.phone, text(data.email), text(data.address), text(data.city),
      text(data.state), text(data.pincode), text(data.propertyType), text(data.roofType), text(data.plantSize),
      text(data.solarPanel), text(data.inverter), text(data.battery), text(data.structureType), numberValue(data.subsidy),
      numberValue(data.totalCost), numberValue(data.netPayable), numberValue(data.monthlyBill),
      numberValue(data.monthlySavings), text(data.roiYears), text(data.paybackPeriod), text(data.installationType),
      text(data.pdfName), text(data.pdfStatus), text(payload.sourcePage), text(payload.sourceUrl),
      text(payload.userAgent), rawJson
    ];
  }

  if (formType === 'roi') {
    return [
      now, requestId, recordId, data.name, data.phone, text(data.email), text(data.city), text(data.state),
      numberValue(data.monthlyElectricityBill), text(data.roofArea), text(data.recommendedPlant),
      numberValue(data.estimatedCost), numberValue(data.estimatedSavings), text(data.roi), text(data.payback),
      text(payload.sourcePage), text(payload.sourceUrl), text(payload.userAgent), rawJson
    ];
  }

  if (formType === 'contact') {
    return [
      now, requestId, recordId, data.name, data.phone, text(data.email), text(data.subject || 'Website contact'),
      text(data.message), text(payload.sourcePage), text(payload.sourceUrl), text(payload.userAgent), rawJson
    ];
  }

  return [
    now, requestId, recordId, data.name, data.phone, text(data.email), text(data.address), text(data.city),
    text(data.serviceType), text(data.issueDescription), text(data.preferredVisitDate),
    text(payload.sourcePage), text(payload.sourceUrl), text(payload.userAgent), rawJson
  ];
}

/**
 * Idempotent retries: same X-Request-ID / requestId must not create duplicate rows.
 * Reads columns B (Request_ID) and C (business record id) from the form sheet only.
 * IMPORTANT: range must include the last data row and both columns; an off-by-one
 * or single-column range caused silent failures in production (duplicates / wrong recordId).
 */
function findExistingRequest(formType, requestId) {
  if (!requestId) return null;
  const sheet = getSheet(formType);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const values = sheet.getRange(2, 2, lastRow - 1, 2).getValues();
  const rid = String(requestId);
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (String(values[index][0]) === rid) {
      return { recordId: String(values[index][1] || '') };
    }
  }
  return null;
}

function logSubmission(requestId, formType, recordId, status, responseTimeMs, message) {
  try {
    getSheet('submissionLog').appendRow([new Date(), requestId, formType, recordId, status, responseTimeMs, message]);
  } catch (error) {
    console.error('Submission log failed: ' + error.message);
  }
}

function logError(requestId, formType, code, message, stack, payload) {
  try {
    getSheet('errorLog').appendRow([new Date(), requestId, formType, code, message, stack || '', safeStringify(payload || {})]);
  } catch (error) {
    console.error('Error log failed: ' + error.message);
  }
}

function maybeNotify(formType, data, recordId) {
  if (!ADMIN_EMAIL || ['quotation', 'contact', 'services'].indexOf(formType) === -1) return;
  try {
    MailApp.sendEmail(
      ADMIN_EMAIL,
      'New ' + formType + ' submission - ' + recordId,
      'Name: ' + data.name + '\nPhone: ' + data.phone + '\nEmail: ' + text(data.email) + '\nRecord: ' + recordId
    );
  } catch (error) {
    logError('', formType, 'EMAIL_FAILED', error.message, error.stack, data);
  }
}

function getSheet(key) {
  const config = SHEETS[key];
  const sheet = getOrCreateSheet(config.tab);
  const width = config.headers.length;
  const current = sheet.getLastRow() ? sheet.getRange(1, 1, 1, width).getValues()[0] : [];
  if (current.join('|') !== config.headers.join('|')) {
    sheet.getRange(1, 1, 1, width).setValues([config.headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Prefer Script Property SPREADSHEET_ID in production so the ID is not only in source.
 */
function getSpreadsheetId_() {
  try {
    const fromProps = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (fromProps && String(fromProps).trim()) return String(fromProps).trim();
  } catch (err) {
    console.warn('PropertiesService unavailable: ' + err.message);
  }
  return SPREADSHEET_ID;
}

function getOrCreateSheet(name) {
  const spreadsheet = SpreadsheetApp.openById(getSpreadsheetId_());
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function appError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function createId(prefix) {
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return prefix + '-' + date + '-' + random;
}

function text(value) {
  return String(value == null ? '' : value).trim();
}

function normalizePhone(value) {
  return text(value).replace(/[^\d+]/g, '');
}

function numberValue(value) {
  const number = Number(value);
  return isNaN(number) ? '' : number;
}

function safeStringify(value) {
  try {
    return JSON.stringify(value || {});
  } catch (error) {
    return '{}';
  }
}
