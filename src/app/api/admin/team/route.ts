import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminError, requirePermission, uniquePlaceholderPhone, writeAudit } from '@/lib/admin';
import { hashPassword, issuePasswordResetForUser } from '@/lib/auth';
import { normalizeEmail, normalizePhone, createSecretToken } from '@/lib/identity';
import { sendStaffInviteEmail, assertEmailDelivered } from '@/lib/email';
import { appBaseUrl } from '@/lib/app-url';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requirePermission('team', 'READ');
    const members = await prisma.user.findMany({
      where: {
        OR: [{ staffProfile: { isNot: null } }, { role: { in: ['ADMIN', 'STAFF'] } }],
      },
      include: {
        staffProfile: true,
        staffRole: true,
        permissionOverrides: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        role: m.role,
        isActive: m.isActive && (m.staffProfile?.isActive ?? true),
        department: m.staffProfile?.department || null,
        roleName: m.staffRole?.name || null,
        staffRoleId: m.staffRoleId,
        overrides: Object.fromEntries(m.permissionOverrides.map((o) => [o.feature, o.level])),
      })),
    });
  } catch (error) {
    return adminError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const staff = await requirePermission('team', 'EDIT');
    const body = await req.json();
    const name = String(body.name || '').trim();
    const email = normalizeEmail(body.email || '');
    const department = String(body.department || 'OPS');
    const roleId = String(body.roleId || '');
    if (!name || !email) return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'That email already has an Apointo account. Assign a staff role from the list instead.' }, { status: 400 });
    }

    const phone = body.phone ? normalizePhone(body.phone) : await uniquePlaceholderPhone();
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: await hashPassword(createSecretToken()),
        role: 'STAFF',
        emailVerifiedAt: new Date(),
        staffRoleId: roleId || null,
        staffProfile: { create: { department, isActive: true } },
      },
    });

    const reset = await issuePasswordResetForUser(user);
    const invite = await sendStaffInviteEmail(email, { name, resetUrl: reset.resetUrl });
    assertEmailDelivered({ sent: Boolean(reset.emailSent && invite.sent), provider: invite.provider });

    await writeAudit({
      actorId: staff.session.id,
      action: 'team.invite',
      targetType: 'user',
      targetId: user.id,
      metadata: { email, department },
    });

    return NextResponse.json({
      user: { id: user.id, email },
      emailSent: reset.emailSent,
      loginUrl: `${appBaseUrl()}/admin`,
    });
  } catch (error) {
    return adminError(error);
  }
}
