import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminError, requirePermission, writeAudit } from '@/lib/admin';
import { hashPassword } from '@/lib/auth';
import { generateTempPassword } from '@/lib/admin-password';
import { sendAccountCreatedEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await requirePermission('accounts', 'EDIT');
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!user.email) return NextResponse.json({ error: 'This account has no email' }, { status: 400 });

    const password = generateTempPassword();
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(password) },
    });

    const mail = await sendAccountCreatedEmail(user.email, {
      name: user.name,
      email: user.email,
      password,
      role: user.role,
    });

    await writeAudit({
      actorId: staff.session.id,
      action: 'account.credentials',
      targetType: 'user',
      targetId: user.id,
      metadata: { emailSent: mail.sent },
    });

    return NextResponse.json({
      ok: true,
      emailSent: mail.sent,
      password,
    });
  } catch (error) {
    return adminError(error);
  }
}
