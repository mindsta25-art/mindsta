/**
 * Backend Unit Tests — Auth Logic
 *
 * Uses Node's built-in test runner (node:test) — ESM-native, no install needed.
 * Run with:  npm test   (from /backend)
 *            node --test tests/auth.test.js
 *
 * Covers:
 *  - OTP generation
 *  - Email format validation
 *  - Password strength validation
 *  - JWT structure
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ── Inline helpers (mirrors auth.js logic) ────────────────────────────────────
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isStrongPassword = (password) => {
  if (password.length < 8) return { ok: false, reason: 'too short' };
  if (!/[A-Z]/.test(password)) return { ok: false, reason: 'no uppercase' };
  if (!/[a-z]/.test(password)) return { ok: false, reason: 'no lowercase' };
  if (!/[0-9]/.test(password)) return { ok: false, reason: 'no number' };
  return { ok: true };
};

// ── OTP Generation ────────────────────────────────────────────────────────────
describe('generateOTP', () => {
  test('returns exactly 6 characters', () => {
    for (let i = 0; i < 50; i++) {
      assert.equal(generateOTP().length, 6);
    }
  });

  test('returns only digits', () => {
    for (let i = 0; i < 50; i++) {
      assert.match(generateOTP(), /^\d{6}$/);
    }
  });

  test('OTP is in range 100000–999999', () => {
    for (let i = 0; i < 50; i++) {
      const num = parseInt(generateOTP(), 10);
      assert.ok(num >= 100000 && num <= 999999, `OTP ${num} out of range`);
    }
  });

  test('generates different OTPs (not always the same)', () => {
    const otps = new Set(Array.from({ length: 20 }, generateOTP));
    assert.ok(otps.size > 1, 'OTPs should not all be identical');
  });
});

// ── Email Validation ──────────────────────────────────────────────────────────
describe('email validation', () => {
  const valid = [
    'user@example.com',
    'john.doe@mindsta.com',
    'user+tag@mail.example.co.uk',
    'test123@sub.domain.com',
  ];

  const invalid = [
    '',
    'notanemail',
    'missing@',
    '@nodomain.com',
    'spaces in@email.com',
    'user@',
    'user@domain',
  ];

  for (const email of valid) {
    test(`accepts valid email: ${email}`, () => {
      assert.equal(isValidEmail(email), true);
    });
  }

  for (const email of invalid) {
    test(`rejects invalid email: "${email}"`, () => {
      assert.equal(isValidEmail(email), false);
    });
  }
});

// ── Password Strength ─────────────────────────────────────────────────────────
describe('password strength', () => {
  test('accepts a strong password', () => {
    assert.deepEqual(isStrongPassword('SecurePass1'), { ok: true });
  });

  test('rejects password shorter than 8 chars', () => {
    const result = isStrongPassword('Ab1');
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'too short');
  });

  test('rejects password with no uppercase', () => {
    const result = isStrongPassword('password1');
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'no uppercase');
  });

  test('rejects password with no lowercase', () => {
    const result = isStrongPassword('PASSWORD1');
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'no lowercase');
  });

  test('rejects password with no number', () => {
    const result = isStrongPassword('SecurePassword');
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'no number');
  });
});

// ── bcrypt password hashing ───────────────────────────────────────────────────
describe('bcrypt password hashing', () => {
  test('hashed password differs from plain text', async () => {
    const plain = 'MyPassword1';
    const hash = await bcrypt.hash(plain, 10);
    assert.notEqual(hash, plain);
  });

  test('hash verifies correctly against the original password', async () => {
    const plain = 'MyPassword1';
    const hash = await bcrypt.hash(plain, 10);
    const match = await bcrypt.compare(plain, hash);
    assert.equal(match, true);
  });

  test('wrong password does not match hash', async () => {
    const hash = await bcrypt.hash('MyPassword1', 10);
    const match = await bcrypt.compare('WrongPassword1', hash);
    assert.equal(match, false);
  });

  test('two hashes of the same password are different (salt)', async () => {
    const plain = 'MyPassword1';
    const hash1 = await bcrypt.hash(plain, 10);
    const hash2 = await bcrypt.hash(plain, 10);
    assert.notEqual(hash1, hash2);
  });
});

// ── JWT token generation & verification ───────────────────────────────────────
describe('JWT tokens', () => {
  const SECRET = 'test-secret-key';

  test('generates a valid token and payload round-trips correctly', () => {
    const payload = { id: 'user123', email: 'test@mindsta.com', userType: 'student' };
    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, SECRET);

    assert.equal(decoded.id, 'user123');
    assert.equal(decoded.email, 'test@mindsta.com');
    assert.equal(decoded.userType, 'student');
  });

  test('token has three dot-separated parts (header.payload.signature)', () => {
    const token = jwt.sign({ id: '1' }, SECRET);
    assert.equal(token.split('.').length, 3);
  });

  test('throws when verified with wrong secret', () => {
    const token = jwt.sign({ id: '1' }, SECRET);
    assert.throws(() => jwt.verify(token, 'wrong-secret'), /invalid signature/i);
  });

  test('throws for expired token', async () => {
    const token = jwt.sign({ id: '1' }, SECRET, { expiresIn: '1ms' });
    await new Promise(r => setTimeout(r, 10)); // wait for expiry
    assert.throws(() => jwt.verify(token, SECRET), /expired/i);
  });
});
