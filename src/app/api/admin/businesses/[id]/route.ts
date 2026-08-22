import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminError, requirePermission, writeAudit } from '@/lib/admin';
import { setBusinessActive } from '@/lib/admin-business';
import { normalizeEmail } from '@/lib/identity';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await requirePermission('businesses', 'EDIT');
    const body = await req.json();

    if (typeof body.isActive === 'boolean') {
      const business = await setBusinessActive(params.id, body.isActive, body.reason);
      await writeAudit({
        actorId: staff.session.id,
        action: body.isActive ? 'business.enable' : 'business.disable',
        targetType: 'business',
        targetId: params.id,
        metadata: { reason: business.disabledReason },
      });
      return NextResponse.json({ business });
    }

    if (body.ownerEmail) {
      const email = normalizeEmail(body.ownerEmail);
      const owner = await prisma.user.findUnique({ where: { email } });
      if (!owner) return NextResponse.json({ error: 'No user with that email. Create them first or include them when creating the shop.' }, { status: 400 });
      if (owner.role === 'CUSTOMER') {
        await prisma.user.update({ where: { id: owner.id }, data: { role: 'OWNER' } });
      }
      const business = await prisma.business.update({
        where: { id: params.id },
        data: { ownerId: owner.id },
      });
      await writeAudit({
        actorId: staff.session.id,
        action: 'business.assign',
        targetType: 'business',
        targetId: params.id,
        metadata: { ownerEmail: email },
      });
      return NextResponse.json({ business });
    }

    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  } catch (error) {
    return adminError(error);
  }
}
