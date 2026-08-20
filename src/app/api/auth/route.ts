import { NextRequest, NextResponse } from 'next/server';
import { registerUser, loginUser, createToken, type UserRole } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, name, phone, password, role, email } = body;

    if (action === 'register') {
      const user = await registerUser({ name, phone, password, role, email });
      const token = await createToken({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role as UserRole,
      });
      const cookieStore = await cookies();
      cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      return NextResponse.json({ user: { id: user.id, name: user.name, phone: user.phone, role: user.role } });
    }

    if (action === 'login') {
      const user = await loginUser(phone, password);
      const token = await createToken({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role as UserRole,
      });
      const cookieStore = await cookies();
      cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      return NextResponse.json({ user: { id: user.id, name: user.name, phone: user.phone, role: user.role } });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return NextResponse.json({ success: true });
}
