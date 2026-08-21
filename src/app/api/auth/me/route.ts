import { NextResponse } from 'next/server';
import { getSession, toSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      emailVerifiedAt: true,
      googleId: true,
    },
  });

  if (!user) return NextResponse.json({ user: null });

  const sessionUser = toSessionUser(user);
  return NextResponse.json({
    user: {
      ...sessionUser,
      emailVerified: Boolean(user.emailVerifiedAt || user.googleId),
    },
  });
}
