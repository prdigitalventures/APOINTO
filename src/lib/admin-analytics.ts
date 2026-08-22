import { startOfDay, subDays, format } from 'date-fns';
import { prisma } from './db';

export type AnalyticsRange = '1d' | '2d' | '7d' | '30d';

export function parseAnalyticsRange(value: string | null): AnalyticsRange {
  if (value === '2d' || value === '7d' || value === '30d' || value === '1d') return value;
  return '1d';
}

function rangeDays(range: AnalyticsRange) {
  if (range === '2d') return 2;
  if (range === '7d') return 7;
  if (range === '30d') return 30;
  return 1;
}

export async function buildAdminAnalytics(range: AnalyticsRange) {
  const days = rangeDays(range);
  const now = new Date();
  const from = startOfDay(subDays(now, days - 1));

  const dayStarts = Array.from({ length: days }, (_, i) => startOfDay(subDays(now, days - 1 - i)));

  const [
    owners,
    customers,
    staff,
    businesses,
    liveBusinesses,
    disabledBusinesses,
    disabledUsers,
    ownersJoined,
    customersJoined,
    businessesCreated,
    liveCreated,
    bookingsInRange,
    ownerRows,
    customerRows,
    bizRows,
    bookingRows,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'OWNER' } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.staffProfile.count({ where: { isActive: true } }),
    prisma.business.count(),
    prisma.business.count({ where: { isActive: true } }),
    prisma.business.count({ where: { isActive: false } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.count({ where: { role: 'OWNER', createdAt: { gte: from } } }),
    prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: from } } }),
    prisma.business.count({ where: { createdAt: { gte: from } } }),
    prisma.business.count({ where: { isActive: true, createdAt: { gte: from } } }),
    prisma.booking.count({ where: { createdAt: { gte: from } } }),
    prisma.user.findMany({
      where: { role: 'OWNER', createdAt: { gte: from } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { role: 'CUSTOMER', createdAt: { gte: from } },
      select: { createdAt: true },
    }),
    prisma.business.findMany({
      where: { createdAt: { gte: from } },
      select: { createdAt: true, isActive: true },
    }),
    prisma.booking.findMany({
      where: { createdAt: { gte: from } },
      select: { createdAt: true },
    }),
  ]);

  const series = dayStarts.map((day) => {
    const key = format(day, 'yyyy-MM-dd');
    const inDay = (d: Date) => format(d, 'yyyy-MM-dd') === key;
    return {
      date: key,
      label: days > 7 ? format(day, 'd MMM') : format(day, 'EEE d'),
      owners: ownerRows.filter((r) => inDay(r.createdAt)).length,
      customers: customerRows.filter((r) => inDay(r.createdAt)).length,
      businesses: bizRows.filter((r) => inDay(r.createdAt)).length,
      live: bizRows.filter((r) => inDay(r.createdAt) && r.isActive).length,
      bookings: bookingRows.filter((r) => inDay(r.createdAt)).length,
    };
  });

  return {
    range,
    from: from.toISOString(),
    totals: {
      owners,
      customers,
      staff,
      businesses,
      liveBusinesses,
      disabledBusinesses,
      disabledUsers,
    },
    period: {
      ownersJoined,
      customersJoined,
      businessesCreated,
      liveCreated,
      bookingsInRange,
    },
    series,
  };
}
