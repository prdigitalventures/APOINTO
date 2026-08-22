import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminError, requirePermission, writeAudit } from '@/lib/admin';
import { setBusinessActive } from '@/lib/admin-business';
import { normalizeEmail } from '@/lib/identity';
import { sendShopAssignedEmail, assertEmailDelivered } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await requirePermission('businesses', 'EDIT');
    const body = await req.json();

    if (body.action === 'notify') {
      const business = await prisma.business.findUnique({
        where: { id: params.id },
        include: { ownerUser: true },
      });
      if (!business?.ownerUser.email) {
        return NextResponse.json({ error: 'Owner has no email' }, { status: 400 });
      }
      const mail = await sendShopAssignedEmail(business.ownerUser.email, {
        ownerName: business.ownerUser.name,
        businessName: business.name,
        slug: business.slug,
      });
      assertEmailDelivered(mail);
      await writeAudit({
        actorId: staff.session.id,
        action: 'business.notify',
        targetType: 'business',
        targetId: params.id,
      });
      return NextResponse.json({ emailSent: mail.sent });
    }

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

    if (body.name || body.location || body.description || body.ownerEmail) {
      let ownerId: string | undefined;
      if (body.ownerEmail) {
        const email = normalizeEmail(body.ownerEmail);
        const owner = await prisma.user.findUnique({ where: { email } });
        if (!owner) {
          return NextResponse.json({ error: 'No user with that email. Create them on Accounts first.' }, { status: 400 });
        }
        if (owner.role === 'CUSTOMER') {
          await prisma.user.update({ where: { id: owner.id }, data: { role: 'OWNER' } });
        }
        ownerId = owner.id;
      }
      const business = await prisma.business.update({
        where: { id: params.id },
        data: {
          ...(typeof body.name === 'string' && body.name.trim() ? { name: body.name.trim() } : {}),
          ...(typeof body.location === 'string' ? { location: body.location.trim() || null } : {}),
          ...(typeof body.description === 'string' ? { description: body.description.trim() || null } : {}),
          ...(ownerId ? { ownerId } : {}),
        },
      });
      await writeAudit({
        actorId: staff.session.id,
        action: 'business.edit',
        targetType: 'business',
        targetId: params.id,
      });
      return NextResponse.json({ business });
    }

    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  } catch (error) {
    return adminError(error);
  }
}
