import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminError, requirePermission } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requirePermission('crm', 'READ');
    const q = req.nextUrl.searchParams.get('q')?.trim() || '';
    const role = req.nextUrl.searchParams.get('role') || '';

    const users = await prisma.user.findMany({
      where: {
        role: role ? role : { in: ['OWNER', 'CUSTOMER'] },
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
        lastLoginAt: true,
        createdAt: true,
        platformContact: { select: { notes: true, tags: true } },
        _count: { select: { businesses: true, bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    return NextResponse.json({
      contacts: users.map((u) => ({
        ...u,
        notes: u.platformContact?.notes || '',
        tags: u.platformContact?.tags || '',
      })),
    });
  } catch (error) {
    return adminError(error);
  }
}
