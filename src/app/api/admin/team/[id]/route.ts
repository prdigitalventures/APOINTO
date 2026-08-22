import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminError, requirePermission, writeAudit } from '@/lib/admin';
import { ADMIN_FEATURES, type PermissionLevel } from '@/lib/admin-permissions';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await requirePermission('team', 'EDIT');
    const body = await req.json();

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (typeof body.isActive === 'boolean') {
      await prisma.staffProfile.upsert({
        where: { userId: params.id },
        create: { userId: params.id, department: body.department || 'OPS', isActive: body.isActive },
        update: { isActive: body.isActive },
      });
      await prisma.user.update({
        where: { id: params.id },
        data: { isActive: body.isActive },
      });
    }

    if (body.department) {
      await prisma.staffProfile.upsert({
        where: { userId: params.id },
        create: { userId: params.id, department: body.department, isActive: true },
        update: { department: body.department },
      });
    }

    if (body.roleId) {
      await prisma.user.update({
        where: { id: params.id },
        data: { staffRoleId: body.roleId, role: user.role === 'OWNER' ? 'OWNER' : 'STAFF' },
      });
    }

    if (body.overrides && typeof body.overrides === 'object') {
      for (const feature of ADMIN_FEATURES) {
        const level = body.overrides[feature] as PermissionLevel | undefined;
        if (!level) continue;
        await prisma.staffPermissionOverride.upsert({
          where: { userId_feature: { userId: params.id, feature } },
          create: { userId: params.id, feature, level },
          update: { level },
        });
      }
    }

    await writeAudit({
      actorId: staff.session.id,
      action: 'team.update',
      targetType: 'user',
      targetId: params.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminError(error);
  }
}
