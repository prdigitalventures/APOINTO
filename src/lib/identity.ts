import { createHash, randomBytes } from 'crypto';

export const ALREADY_REGISTERED_MESSAGE =
  'This email/number is already registered. Please login with your credentials.';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createSecretToken(): string {
  return randomBytes(32).toString('hex');
}
