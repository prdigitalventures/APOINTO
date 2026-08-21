import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { sendVerificationEmail } from './email';
import {
  ALREADY_REGISTERED_MESSAGE,
  createSecretToken,
  hashToken,
  normalizeEmail,
  normalizePhone,
} from './identity';

export type UserRole = 'OWNER' | 'CUSTOMER';
export {
  ALREADY_REGISTERED_MESSAGE,
  createSecretToken,
  hashToken,
  normalizeEmail,
  normalizePhone,
} from './identity';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'apointo-dev-secret'
);

export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  emailVerified: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function toSessionUser(user: {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  emailVerifiedAt?: Date | null;
}): SessionUser {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role as UserRole,
    emailVerified: Boolean(user.emailVerifiedAt),
  };
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user = payload as unknown as SessionUser;
    return {
      ...user,
      emailVerified: Boolean(user.emailVerified),
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function requireOwner(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== 'OWNER') throw new Error('Forbidden');
  return session;
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createToken(user);
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function customerCanBook(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerifiedAt: true, googleId: true, role: true },
  });
  if (!user) return false;
  return Boolean(user.emailVerifiedAt || user.googleId);
}

export async function requireVerifiedCustomer(session: SessionUser | null) {
  if (!session) {
    return { ok: false as const, status: 401, error: 'Please log in to book an appointment.' };
  }
  const allowed = await customerCanBook(session.id);
  if (!allowed) {
    return {
      ok: false as const,
      status: 403,
      error: 'Please verify your email before booking. You can still browse available slots.',
    };
  }
  return { ok: true as const };
}

export async function issueEmailVerification(userId: string, email: string) {
  const token = createSecretToken();
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerifyTokenHash: hashToken(token),
      emailVerifyExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });
  return sendVerificationEmail(email, token);
}

export async function registerUser(data: {
  name: string;
  phone: string;
  password: string;
  role?: UserRole;
  email: string;
}) {
  const name = data.name.trim();
  const email = normalizeEmail(data.email);
  const phone = normalizePhone(data.phone);

  if (!name) throw new Error('Name is required');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid email is required');
  if (!phone || phone.length < 10) throw new Error('A valid phone number is required');
  if (!data.password || data.password.length < 6) throw new Error('Password must be at least 6 characters');

  const existing = await prisma.user.findFirst({
    where: { OR: [{ phone }, { email }] },
  });
  if (existing) throw new Error(ALREADY_REGISTERED_MESSAGE);

  try {
    const hashed = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        password: hashed,
        role: data.role || 'CUSTOMER',
        email,
      },
    });

    const mail = await issueEmailVerification(user.id, email);
    return { user, verifyUrl: mail.url, emailSent: mail.sent };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'P2002') throw new Error(ALREADY_REGISTERED_MESSAGE);
    throw error;
  }
}

export async function loginUser(identifier: string, password: string) {
  const raw = identifier.trim();
  const email = raw.includes('@') ? normalizeEmail(raw) : null;
  const phone = email ? null : normalizePhone(raw);

  const user = await prisma.user.findFirst({
    where: email ? { email } : { phone: phone || raw },
  });
  if (!user) throw new Error('Invalid credentials');
  const valid = await verifyPassword(password, user.password);
  if (!valid) throw new Error('Invalid credentials');
  return user;
}

export async function verifyEmailToken(token: string) {
  if (!token) throw new Error('Invalid or expired verification link');
  const hash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: {
      emailVerifyTokenHash: hash,
      emailVerifyExpiresAt: { gt: new Date() },
    },
  });
  if (!user) throw new Error('Invalid or expired verification link');
  return prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerifyTokenHash: null,
      emailVerifyExpiresAt: null,
    },
  });
}

export async function requestPasswordReset(emailRaw: string) {
  const email = normalizeEmail(emailRaw);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { ok: true };
  }
  const token = createSecretToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: hashToken(token),
      passwordResetExpiresAt: new Date(Date.now() + 1000 * 60 * 60),
    },
  });
  const mail = await sendPasswordResetEmailSafe(email, token);
  return { ok: true, resetUrl: mail.url, emailSent: mail.sent };
}

async function sendPasswordResetEmailSafe(email: string, token: string) {
  const { sendPasswordResetEmail } = await import('./email');
  return sendPasswordResetEmail(email, token);
}

export async function resetPasswordWithToken(token: string, password: string) {
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters');
  const hash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: hash,
      passwordResetExpiresAt: { gt: new Date() },
    },
  });
  if (!user) throw new Error('Invalid or expired reset link');
  const hashed = await hashPassword(password);
  return prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });
}

export async function upsertGoogleUser(profile: {
  googleId: string;
  email: string;
  name: string;
  phone?: string;
  role?: UserRole;
}) {
  const email = normalizeEmail(profile.email);
  const existingByGoogle = await prisma.user.findUnique({ where: { googleId: profile.googleId } });
  if (existingByGoogle) {
    const user = await prisma.user.update({
      where: { id: existingByGoogle.id },
      data: {
        email,
        emailVerifiedAt: existingByGoogle.emailVerifiedAt || new Date(),
        ...(profile.role === 'OWNER' ? { role: 'OWNER' } : {}),
      },
    });
    return { user, created: false };
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) {
    const user = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        googleId: profile.googleId,
        emailVerifiedAt: new Date(),
        ...(profile.role === 'OWNER' ? { role: 'OWNER' } : {}),
      },
    });
    return { user, created: false };
  }

  if (!profile.phone) {
    return { user: null, created: false, needsPhone: true as const };
  }

  const phone = normalizePhone(profile.phone);
  const existingPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingPhone) throw new Error(ALREADY_REGISTERED_MESSAGE);

  const user = await prisma.user.create({
    data: {
      name: profile.name.trim() || 'Customer',
      email,
      phone,
      googleId: profile.googleId,
      emailVerifiedAt: new Date(),
      role: profile.role || 'CUSTOMER',
      password: await hashPassword(createSecretToken()),
    },
  }).catch((error: { code?: string }) => {
    if (error.code === 'P2002') throw new Error(ALREADY_REGISTERED_MESSAGE);
    throw error;
  });
  return { user, created: true };
}
