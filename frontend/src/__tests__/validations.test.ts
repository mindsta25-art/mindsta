/**
 * Unit Tests — src/lib/validations.ts
 *
 * Tests: signInSchema, signUpSchema, bankDetailsSchema
 */

import { describe, it, expect } from 'vitest';
import { signInSchema, signUpSchema, bankDetailsSchema } from '../lib/validations';

// ── signInSchema ──────────────────────────────────────────────────────────────
describe('signInSchema', () => {
  const valid = { email: 'user@mindsta.com', password: 'Password1' };

  it('passes with valid credentials', () => {
    expect(signInSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing email', () => {
    const result = signInSchema.safeParse({ ...valid, email: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = signInSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0].message;
      expect(msg).toMatch(/email/i);
    }
  });

  it('rejects missing password', () => {
    const result = signInSchema.safeParse({ ...valid, password: '' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 6 characters', () => {
    const result = signInSchema.safeParse({ ...valid, password: '123' });
    expect(result.success).toBe(false);
  });
});

// ── signUpSchema ──────────────────────────────────────────────────────────────
describe('signUpSchema', () => {
  const validStudent = {
    fullName: 'John Doe',
    email: 'john@mindsta.com',
    password: 'Password1',
    confirmPassword: 'Password1',
    userType: 'student' as const,
    grade: 'Grade 5',
    age: '10',
    isParentGuardian: true,
    agreedToTerms: true,
  };

  const validReferral = {
    fullName: 'Jane Smith',
    email: 'jane@mindsta.com',
    password: 'SecurePass9',
    confirmPassword: 'SecurePass9',
    userType: 'referral' as const,
    isParentGuardian: true,
    agreedToTerms: true,
  };

  it('passes for valid student data', () => {
    expect(signUpSchema.safeParse(validStudent).success).toBe(true);
  });

  it('passes for valid referral data', () => {
    expect(signUpSchema.safeParse(validReferral).success).toBe(true);
  });

  it('rejects fullName shorter than 2 characters', () => {
    const result = signUpSchema.safeParse({ ...validStudent, fullName: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejects fullName longer than 100 characters', () => {
    const result = signUpSchema.safeParse({ ...validStudent, fullName: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects password without uppercase letter', () => {
    const result = signUpSchema.safeParse({ ...validStudent, password: 'password1', confirmPassword: 'password1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map(i => i.message).join(' ');
      expect(msgs).toMatch(/uppercase/i);
    }
  });

  it('rejects password without a number', () => {
    const result = signUpSchema.safeParse({ ...validStudent, password: 'Password', confirmPassword: 'Password' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = signUpSchema.safeParse({ ...validStudent, password: 'Pass1', confirmPassword: 'Pass1' });
    expect(result.success).toBe(false);
  });

  it('rejects when passwords do not match', () => {
    const result = signUpSchema.safeParse({ ...validStudent, confirmPassword: 'DifferentPass1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map(i => i.message).join(' ');
      expect(msgs).toMatch(/match/i);
    }
  });

  it('rejects student missing grade or age', () => {
    const { grade: _g, ...noGrade } = validStudent;
    const result = signUpSchema.safeParse(noGrade);
    expect(result.success).toBe(false);
  });

  it('rejects invalid userType', () => {
    const result = signUpSchema.safeParse({ ...validStudent, userType: 'admin' });
    expect(result.success).toBe(false);
  });

  it('accepts optional referralCode', () => {
    const result = signUpSchema.safeParse({ ...validReferral, referralCode: 'ABC123' });
    expect(result.success).toBe(true);
  });
});

// ── bankDetailsSchema ─────────────────────────────────────────────────────────
describe('bankDetailsSchema', () => {
  const valid = {
    accountNumber: '1234567890',
    bankName: 'First Bank',
    accountName: 'John Doe',
  };

  it('passes with valid bank details', () => {
    expect(bankDetailsSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects account number with letters', () => {
    const result = bankDetailsSchema.safeParse({ ...valid, accountNumber: '12345ABCDE' });
    expect(result.success).toBe(false);
  });

  it('rejects account number shorter than 10 digits', () => {
    const result = bankDetailsSchema.safeParse({ ...valid, accountNumber: '12345' });
    expect(result.success).toBe(false);
  });

  it('rejects account number longer than 10 digits', () => {
    const result = bankDetailsSchema.safeParse({ ...valid, accountNumber: '12345678901' });
    expect(result.success).toBe(false);
  });

  it('rejects missing bank name', () => {
    const result = bankDetailsSchema.safeParse({ ...valid, bankName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing account name', () => {
    const result = bankDetailsSchema.safeParse({ ...valid, accountName: '' });
    expect(result.success).toBe(false);
  });

  it('accepts optional commissionRate within 0–100', () => {
    const result = bankDetailsSchema.safeParse({ ...valid, commissionRate: 25 });
    expect(result.success).toBe(true);
  });

  it('rejects commissionRate above 100', () => {
    const result = bankDetailsSchema.safeParse({ ...valid, commissionRate: 101 });
    expect(result.success).toBe(false);
  });

  it('rejects negative commissionRate', () => {
    const result = bankDetailsSchema.safeParse({ ...valid, commissionRate: -1 });
    expect(result.success).toBe(false);
  });
});
