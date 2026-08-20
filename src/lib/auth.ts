import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

export type UserRole = 'OWNER' | 'CUSTOMER';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'apointo-dev-secret'
);

export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
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
    return payload as unknown as SessionUser;
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

export async function registerUser(data: {
  name: string;
  phone: string;
  password: string;
  role?: UserRole;
  email?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existing) throw new Error('Phone number already registered');

  const hashed = await hashPassword(data.password);
  return prisma.user.create({
    data: {
      name: data.name,
      phone: data.phone,
      password: hashed,
      role: data.role || 'CUSTOMER',
      email: data.email,
    },
  });
}

export async function loginUser(phone: string, password: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new Error('Invalid credentials');
  const valid = await verifyPassword(password, user.password);
  if (!valid) throw new Error('Invalid credentials');
  return user;
}
