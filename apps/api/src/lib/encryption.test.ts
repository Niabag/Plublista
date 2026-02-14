import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Use a valid 32-byte (64 hex chars) test key
const TEST_KEY = 'a'.repeat(64);

describe('encryption', () => {
  beforeEach(() => {
    vi.stubEnv('ENCRYPTION_KEY', TEST_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('encrypts and decrypts a string round-trip', async () => {
    const { encrypt, decrypt } = await import('./encryption');
    const plaintext = 'my-secret-oauth-token-12345';
    const encrypted = encrypt(plaintext);

    expect(encrypted).not.toBe(plaintext);
    expect(encrypted).toContain(':'); // iv:authTag:ciphertext format

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertext for same input (random IV)', async () => {
    const { encrypt } = await import('./encryption');
    const plaintext = 'same-input';

    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);

    expect(encrypted1).not.toBe(encrypted2);
  });

  it('decrypts correctly with special characters', async () => {
    const { encrypt, decrypt } = await import('./encryption');
    const plaintext = 'token/with+special=chars&more!@#$%^*()';

    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
  });

  it('decrypts correctly with empty-ish but valid input', async () => {
    const { encrypt, decrypt } = await import('./encryption');
    const plaintext = 'x';

    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
  });

  it('throws on decrypt with tampered ciphertext', async () => {
    const { encrypt, decrypt } = await import('./encryption');
    const encrypted = encrypt('test-token');

    // Tamper with the ciphertext part
    const parts = encrypted.split(':');
    parts[2] = 'AAAA' + parts[2].slice(4); // corrupt ciphertext
    const tampered = parts.join(':');

    expect(() => decrypt(tampered)).toThrow();
  });

  it('throws on decrypt with invalid format', async () => {
    const { decrypt } = await import('./encryption');

    expect(() => decrypt('not-valid-format')).toThrow();
  });

  it('throws if ENCRYPTION_KEY is missing', async () => {
    vi.stubEnv('ENCRYPTION_KEY', '');

    // Need fresh import to avoid caching
    vi.resetModules();
    const { encrypt } = await import('./encryption');

    expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY');
  });

  it('throws if ENCRYPTION_KEY is wrong length', async () => {
    vi.stubEnv('ENCRYPTION_KEY', 'tooshort');

    vi.resetModules();
    const { encrypt } = await import('./encryption');

    expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY');
  });
});
