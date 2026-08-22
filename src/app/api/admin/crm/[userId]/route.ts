import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminError, requirePermission, writeAudit } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    await requirePermission('crm', 'READ');
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        platformContact: true,
        businesses: { select: { id: true, name: true, slug: true, isActive: true, uniqueCode: true } },
        _count: { select: { bookings: true } },
      },
    });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({
      contact: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        notes: user.platformContact?.notes || '',
        tags: user.platformContact?.tags || '',
        businesses: user.businesses,
        bookingCount: user._count.bookings,
      },
    });
  } catch (error) {
    return adminError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const staff = await requirePermission('crm', 'EDIT');
    const body = await req.json();
    const notes = typeof body.notes === 'string' ? body.notes : undefined;
    const tags = typeof body.tags === 'string' ? body.tags : undefined;

    const contact = await prisma.platformContact.upsert({
      where: { userId: params.userId },
      create: {
        userId: params.userId,
        notes: notes || '',
        tags: tags || '',
      },
      update: {
        ...(notes !== undefined ? { notes } : {}),
        ...(tags !== undefined ? { tags } : {}),
      },
    });

    await writeAudit({
      actorId: staff.session.id,
      action: 'crm.update',
      targetType: 'user',
      targetId: params.userId,
    });

    return NextResponse.json({ contact });
  } catch (error) {
    return adminError(error);
  }
}
