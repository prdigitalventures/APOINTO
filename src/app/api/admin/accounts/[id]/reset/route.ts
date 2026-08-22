import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminError, requirePermission, writeAudit } from '@/lib/admin';
import { issuePasswordResetForUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await requirePermission('accounts', 'EDIT');
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const result = await issuePasswordResetForUser(user);
    await writeAudit({
      actorId: staff.session.id,
      action: 'account.reset',
      targetType: 'user',
      targetId: user.id,
      metadata: { email: user.email, emailSent: result.emailSent },
    });

    return NextResponse.json({
      ok: true,
      emailSent: result.emailSent,
      ...(process.env.NODE_ENV !== 'production' ? { resetUrl: result.resetUrl } : {}),
    });
  } catch (error) {
    return adminError(error);
  }
}
