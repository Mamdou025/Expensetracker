const crypto = require('crypto');

// Derive a stable AES-256 key from INBOUND_EMAIL_SECRET via HKDF. This lets us
// reuse the single webhook secret as the root of the encryption-at-rest scheme
// without managing yet another secret. If you ever rotate INBOUND_EMAIL_SECRET,
// existing encrypted rows become unreadable — handle that as a deliberate
// migration when the time comes.
function getKey() {
  const secret = process.env.INBOUND_EMAIL_SECRET;
  if (!secret) {
    throw new Error('INBOUND_EMAIL_SECRET is not set — cannot encrypt/decrypt email bodies');
  }
  return crypto.hkdfSync(
    'sha256',
    Buffer.from(secret, 'utf8'),
    Buffer.alloc(0),
    Buffer.from('exptrackr:email-body:v1', 'utf8'),
    32
  );
}

// Returns a string of the form `v1:<iv-b64>:<tag-b64>:<ciphertext-b64>` which
// is easy to detect at read time. Null/undefined input passes through.
function encryptString(plaintext) {
  if (plaintext == null) return null;
  if (typeof plaintext !== 'string') plaintext = String(plaintext);
  const key = Buffer.from(getKey());
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
}

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith('v1:');
}

function decryptString(value) {
  if (value == null) return null;
  if (!isEncrypted(value)) return value;
  const [, ivB64, tagB64, ctB64] = value.split(':');
  const key = Buffer.from(getKey());
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const pt = Buffer.concat([
    decipher.update(Buffer.from(ctB64, 'base64')),
    decipher.final(),
  ]);
  return pt.toString('utf8');
}

module.exports = { encryptString, decryptString, isEncrypted };
