'use strict';

const QRCode = require('qrcode');

const BASE_URL = process.env.EVENTFLOW_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/** Returns the check-in URL for a registration code */
function checkinUrl(registrationCode) {
  return `${BASE_URL}/api/eventflow/checkin/scan/${registrationCode}`;
}

/** SVG string — for embedding in emails / pages */
async function toSVG(registrationCode) {
  return QRCode.toString(checkinUrl(registrationCode), {
    type: 'svg',
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
    width: 200,
  });
}

/** Base64 data URI (PNG) — for inline email img src */
async function toDataURI(registrationCode) {
  return QRCode.toDataURL(checkinUrl(registrationCode), {
    type: 'image/png',
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
    width: 300,
    errorCorrectionLevel: 'M',
  });
}

/** Buffer — for email attachment */
async function toBuffer(registrationCode) {
  return QRCode.toBuffer(checkinUrl(registrationCode), {
    type: 'png',
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
    width: 400,
    errorCorrectionLevel: 'M',
  });
}

module.exports = { checkinUrl, toSVG, toDataURI, toBuffer };
