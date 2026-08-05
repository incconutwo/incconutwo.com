import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Try to use Vite's import.meta.env first, fallback to process.env
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});

const rawKey = env.COOKIE_ENCRYPTION_KEY || 'fallback-dev-encryption-key-for-local-testing';

// Key must be exactly 32 bytes (256 bits) for aes-256-gcm. We derive it using sha256 to guarantee correct length.
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(rawKey)).digest('base64').substring(0, 32);

/**
 * Encrypts a string using AES-256-GCM.
 * @param {string} text - The plaintext string to encrypt.
 * @returns {string} - The encrypted string format: iv:authTag:encryptedData
 */
export function encrypt(text) {
  if (!text) return text;
  
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string that was encrypted with encrypt().
 * @param {string} text - The encrypted string format: iv:authTag:encryptedData
 * @returns {string} - The decrypted plaintext string.
 */
export function decrypt(text) {
  if (!text) return text;

  const parts = text.split(':');
  // Fallback for unencrypted cookies (e.g. before this security update was applied)
  if (parts.length !== 3) {
    return text;
  }
  
  try {
    const [ivHex, authTagHex, encryptedHex] = parts;
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Failed to decrypt cookie string:', error.message);
    // If decryption fails (e.g., wrong key), we just return null or throw.
    return null;
  }
}
