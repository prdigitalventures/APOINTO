import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordWithToken, setSessionCookie, toSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await resetPasswordWithToken(String(body.token || ''), String(body.password || ''));
    const session = toSessionUser(user);
    await setSessionCookie(session);
    return NextResponse.json({
      user: {
        id: session.id,
        name: session.name,
        phone: session.phone,
        email: session.email,
        role: session.role,
        emailVerified: session.emailVerified,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
