import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminError, requirePermission, writeAudit } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requirePermission('accounts', 'READ');
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(status === 'disabled' ? { isActive: false } : status === 'active' ? { isActive: true } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        disabledReason: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { businesses: true, bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ users });
  } catch (error) {
    return adminError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const staff = await requirePermission('accounts', 'EDIT');
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'User id is required' }, { status: 400 });
    if (id === staff.session.id) {
      return NextResponse.json({ error: 'You cannot disable your own account.' }, { status: 400 });
    }

    const isActive = Boolean(body.isActive);
    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive,
        disabledReason: isActive ? null : String(body.reason || 'Disabled by Apointo admin'),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        disabledReason: true,
      },
    });

    await writeAudit({
      actorId: staff.session.id,
      action: isActive ? 'account.enable' : 'account.disable',
      targetType: 'user',
      targetId: id,
      metadata: { reason: user.disabledReason },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return adminError(error);
  }
}
