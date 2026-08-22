import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminError, requirePermission } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requirePermission('dashboard', 'READ');
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [owners, customers, staff, businesses, disabledBusinesses, disabledUsers, bookingsToday] =
      await Promise.all([
        prisma.user.count({ where: { role: 'OWNER' } }),
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.staffProfile.count({ where: { isActive: true } }),
        prisma.business.count(),
        prisma.business.count({ where: { isActive: false } }),
        prisma.user.count({ where: { isActive: false } }),
        prisma.booking.count({ where: { date: { gte: start } } }),
      ]);

    return NextResponse.json({
      owners,
      customers,
      staff,
      businesses,
      disabledBusinesses,
      disabledUsers,
      bookingsToday,
    });
  } catch (error) {
    return adminError(error);
  }
}
