import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSessionCookie, toSessionUser, verifyEmailToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await verifyEmailToken(String(body.token || ''));
    const session = toSessionUser(user);
    const current = await getSession();
    if (!current || current.id === user.id) {
      await setSessionCookie(session);
    }
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
