import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { setSessionCookie, toSessionUser, upsertGoogleUser, type UserRole } from '@/lib/auth';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'apointo-dev-secret');

export async function GET() {
  try {
    const cookieStore = await cookies();
    const pending = cookieStore.get('google_pending')?.value;
    if (!pending) return NextResponse.json({ pending: null });
    const { payload } = await jwtVerify(pending, JWT_SECRET);
    return NextResponse.json({
      pending: {
        name: payload.name || '',
        email: payload.email || '',
      },
    });
  } catch {
    return NextResponse.json({ pending: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const pending = cookieStore.get('google_pending')?.value;
    if (!pending) {
      return NextResponse.json({ error: 'Google sign-up expired. Please start again.' }, { status: 400 });
    }

    const { payload } = await jwtVerify(pending, JWT_SECRET);
    const googleId = String(payload.googleId || '');
    const email = String(payload.email || '');
    const name = String(payload.name || '');
    const role = (payload.role === 'OWNER' ? 'OWNER' : 'CUSTOMER') as UserRole;
    if (!googleId || !email) {
      return NextResponse.json({ error: 'Google sign-up expired. Please start again.' }, { status: 400 });
    }

    const body = await req.json();
    const result = await upsertGoogleUser({
      googleId,
      email,
      name: body.name || name,
      phone: body.phone,
      role,
    });

    if (!result.user) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    cookieStore.delete('google_pending');
    const session = toSessionUser(result.user);
    await setSessionCookie(session);
    return NextResponse.json({
      user: {
        id: session.id,
        name: session.name,
        phone: session.phone,
        email: session.email,
        role: session.role,
        emailVerified: true,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
