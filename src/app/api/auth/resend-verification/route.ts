import { NextResponse } from 'next/server';
import { getSession, issueEmailVerification } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Please log in' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    if (user.emailVerifiedAt || user.googleId) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    const mail = await issueEmailVerification(user.id, user.email);
    return NextResponse.json({
      ok: true,
      emailSent: mail.sent,
      ...(process.env.NODE_ENV !== 'production' ? { verifyUrl: mail.url } : {}),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
