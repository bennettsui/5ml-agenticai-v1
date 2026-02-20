// services/encryption.js
// Application-level AES-256-GCM encryption for PII fields stored in the database.
//
// Usage:
//   const { encrypt, decrypt, decryptRow } = require('./services/encryption');
//
//   // Encrypting before INSERT:
//   pool.query(sql, [encrypt(name), encrypt(email), phone ? encrypt(phone) : null, ...]);
//
//   // Decrypting after SELECT:
//   const rows = result.rows.map(row => decryptRow(row, ['name','email','phone','message']));
//
// Key setup (generate once, store in .env):
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
//   → add to .env as ENCRYPTION_KEY=<64-char hex>

'use strict';

const crypto = require('crypto');
const ALGORITHM = 'aes-256-gcm';

// PII fields to encrypt per table — import and reuse in your route files
const PII_FIELDS = {
  recruitai_leads:   ['name', 'email', 'phone', 'company', 'message'],
  radiance_leads:    ['name', 'email', 'phone', 'company', 'message'],
  radiance_contact:  ['name', 'email', 'phone', 'company', 'industry', 'message'],
};

function getKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error('ENCRYPTION_KEY not configured in environment');
  // Accept 64-char hex (32 bytes) or 44-char base64 (32 bytes)
  if (raw.length === 64) return Buffer.from(raw, 'hex');
  if (raw.length === 44) return Buffer.from(raw, 'base64');
  throw new Error(
    'ENCRYPTION_KEY must be 64 hex characters or 44 base64 characters (representing 32 bytes). ' +
    'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a compact JSON envelope (v1 format).
 * Passes through null/undefined/empty strings unchanged.
 */
function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') return plaintext;
  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit IV — recommended for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);
  // Envelope: ~170-220 chars for typical PII — fits VARCHAR(255) safely
  return JSON.stringify({
    v: 1,
    iv:  iv.toString('base64'),
    enc: encrypted.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  });
}

/**
 * Decrypt a v1 envelope produced by encrypt().
 * Gracefully handles:
 *   - null/undefined → returned as-is
 *   - Legacy plaintext rows (pre-encryption migration) → returned as-is
 *   - Tampered/wrong-key data → returns '[encrypted]' placeholder
 */
function decrypt(ciphertext) {
  if (ciphertext === null || ciphertext === undefined) return ciphertext;
  let parsed;
  try {
    parsed = JSON.parse(ciphertext);
  } catch {
    // Not JSON — legacy plaintext, return as-is
    return ciphertext;
  }
  if (!parsed || parsed.v !== 1 || !parsed.enc || !parsed.iv || !parsed.tag) {
    // JSON but not our envelope format — return as-is
    return ciphertext;
  }
  try {
    const key = getKey();
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(parsed.iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(parsed.tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(parsed.enc, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    // Wrong key or tampered ciphertext — fail safe, never throw
    return '[encrypted]';
  }
}

/**
 * Decrypt specific PII fields in a DB row, returning a new object.
 * Non-PII fields (IDs, timestamps, UTM params, etc.) are left untouched.
 *
 * @param {object} row      - DB row object
 * @param {string[]} fields - field names to decrypt
 */
function decryptRow(row, fields) {
  if (!row) return row;
  const out = { ...row };
  for (const field of fields) {
    if (out[field] !== null && out[field] !== undefined) {
      out[field] = decrypt(out[field]);
    }
  }
  return out;
}

module.exports = { encrypt, decrypt, decryptRow, PII_FIELDS };
