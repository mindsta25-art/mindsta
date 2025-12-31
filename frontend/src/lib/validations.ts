import { z } from 'zod';

// Sign In validation schema
export const signInSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
});

export type SignInFormData = z.infer<typeof signInSchema>;

// Sign Up validation schema
export const signUpSchema = z.object({
  fullName: z.string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
  userType: z.enum(['student', 'referral'], {
    required_error: 'Please select a user type',
  }),
  // Student-specific fields (conditionally required)
  grade: z.string().optional(),
  age: z.string().optional(),
  schoolName: z.string().optional(),
  // Referral code (optional)
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // If userType is student, require grade, age, and schoolName
  if (data.userType === 'student') {
    return data.grade && data.age && data.schoolName;
  }
  return true;
}, {
  message: "Grade, age, and school name are required for students",
  path: ["grade"],
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

// Bank details validation schema
export const bankDetailsSchema = z.object({
  accountNumber: z.string()
    .min(1, 'Account number is required')
    .length(10, 'Account number must be exactly 10 digits')
    .regex(/^\d+$/, 'Account number must contain only digits'),
  bankName: z.string()
    .min(1, 'Please select a bank')
    .min(2, 'Bank name is required'),
  accountName: z.string()
    .min(1, 'Account name is required')
    .min(2, 'Account name must be at least 2 characters'),
  commissionRate: z.number()
    .min(0, 'Commission rate must be positive')
    .max(100, 'Commission rate cannot exceed 100%')
    .optional(),
});

export type BankDetailsFormData = z.infer<typeof bankDetailsSchema>;

// Referral code validation
export const referralCodeSchema = z.object({
  referralCode: z.string()
    .length(6, 'Referral code must be 6 characters')
    .regex(/^[A-Z0-9]+$/, 'Invalid referral code format'),
});

export type ReferralCodeFormData = z.infer<typeof referralCodeSchema>;
