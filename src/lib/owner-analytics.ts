import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import { prisma } from './db';
import { OWNER_INACTIVE_BOOKING_STATUSES, OWNER_LEAD_STATUSES } from './owner-booking';

export type OwnerAnalyticsRange = '1d' | '7d' | '30d';

const INACTIVE_BOOKING = [...OWNER_INACTIVE_BOOKING_STATUSES];

export function parseOwnerAnalyticsRange(value: string | null): OwnerAnalyticsRange {
  if (value === '7d' || value === '30d' || value === '1d') return value;
  return '7d';
}

function rangeDays(range: OwnerAnalyticsRange) {
  if (range === '30d') return 30;
  if (range === '1d') return 1;
  return 7;
}

export async function buildOwnerAnalytics(ownerId: string, businessId: string | null, range: OwnerAnalyticsRange) {
  const shops = await prisma.business.findMany({
    where: { ownerId, ...(businessId ? { id: businessId } : {}) },
    select: { id: true, name: true },
  });
  const ids = shops.map((s) => s.id);
  const days = rangeDays(range);
  const now = new Date();
  const from = startOfDay(subDays(now, days - 1));
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const dayStarts = Array.from({ length: days }, (_, i) => startOfDay(subDays(now, days - 1 - i)));

  if (ids.length === 0) {
    return {
      range,
      from: from.toISOString(),
      shopCount: 0,
      totals: {
        bookings: 0,
        customers: 0,
        revenue: 0,
        services: 0,
        staff: 0,
        shops: 0,
        upcoming: 0,
        pending: 0,
        todayBookings: 0,
      },
      period: {
        bookingsInRange: 0,
        revenueInRange: 0,
      },
      series: dayStarts.map((day) => ({
        date: format(day, 'yyyy-MM-dd'),
        label: days > 7 ? format(day, 'd MMM') : format(day, 'EEE d'),
        bookings: 0,
        revenue: 0,
      })),
    };
  }

  const bizFilter = { businessId: { in: ids } };

  const [
    bookings,
    customers,
    services,
    staff,
    upcoming,
    pending,
    todayBookings,
    rangeBookings,
    paidRows,
  ] = await Promise.all([
    prisma.booking.count({
      where: { ...bizFilter, status: { notIn: INACTIVE_BOOKING } },
    }),
    prisma.booking.groupBy({
      by: ['customerPhone'],
      where: { ...bizFilter, status: { notIn: INACTIVE_BOOKING } },
    }),
    prisma.service.count({ where: { ...bizFilter, isActive: true } }),
    prisma.staff.count({ where: { ...bizFilter, isActive: true } }),
    prisma.booking.count({
      where: {
        ...bizFilter,
        status: { notIn: [...INACTIVE_BOOKING, 'COMPLETED'] },
        date: { gte: todayStart },
      },
    }),
    prisma.booking.count({
      where: { ...bizFilter, status: { in: [...OWNER_LEAD_STATUSES] } },
    }),
    prisma.booking.count({
      where: {
        ...bizFilter,
        status: { notIn: INACTIVE_BOOKING },
        date: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.booking.findMany({
      where: {
        ...bizFilter,
        status: { notIn: INACTIVE_BOOKING },
        date: { gte: from, lte: todayEnd },
      },
      select: { date: true },
    }),
    prisma.booking.findMany({
      where: { ...bizFilter, paidAt: { not: null } },
      select: {
        paidAt: true,
        service: { select: { price: true } },
      },
    }),
  ]);

  const revenue = paidRows.reduce((sum, row) => sum + (row.service?.price || 0), 0);
  const revenueInRange = paidRows
    .filter((row) => row.paidAt && row.paidAt >= from)
    .reduce((sum, row) => sum + (row.service?.price || 0), 0);

  const series = dayStarts.map((day) => {
    const key = format(day, 'yyyy-MM-dd');
    const inDay = (d: Date) => format(d, 'yyyy-MM-dd') === key;
    return {
      date: key,
      label: days > 7 ? format(day, 'd MMM') : format(day, 'EEE d'),
      bookings: rangeBookings.filter((r) => inDay(r.date)).length,
      revenue: paidRows
        .filter((r) => r.paidAt && inDay(r.paidAt))
        .reduce((sum, row) => sum + (row.service?.price || 0), 0),
    };
  });

  return {
    range,
    from: from.toISOString(),
    shopCount: ids.length,
    totals: {
      bookings,
      customers: customers.length,
      revenue,
      services,
      staff,
      shops: ids.length,
      upcoming,
      pending,
      todayBookings,
    },
    period: {
      bookingsInRange: rangeBookings.length,
      revenueInRange,
    },
    series,
  };
}
