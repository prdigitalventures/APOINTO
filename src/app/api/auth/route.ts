import { NextRequest, NextResponse } from 'next/server';
import { registerUser, loginUser, setSessionCookie, toSessionUser, type UserRole } from '@/lib/auth';

function publicUser(user: ReturnType<typeof toSessionUser>) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, name, phone, password, role, email } = body;

    if (action === 'register') {
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }
      const { user, verifyUrl, emailSent } = await registerUser({
        name,
        phone,
        password,
        role: role as UserRole,
        email,
      });
      const session = toSessionUser(user);
      await setSessionCookie(session);
      return NextResponse.json({
        user: publicUser(session),
        emailSent,
        ...(process.env.NODE_ENV !== 'production' ? { verifyUrl } : {}),
      });
    }

    if (action === 'login') {
      const identifier = phone || email || body.identifier;
      const user = await loginUser(identifier, password);
      const session = toSessionUser(user);
      await setSessionCookie(session);
      return NextResponse.json({ user: publicUser(session) });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return NextResponse.json({ success: true });
}
