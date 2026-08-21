import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      business: {
        ownerId: session.id,
      },
    },
    select: {
      customerName: true,
      customerPhone: true,
      date: true,
      startTime: true,
      business: {
        select: { name: true },
      },
    },
    orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
  });

  const customers = Array.from(
    bookings.reduce((byPhone, booking) => {
      if (!byPhone.has(booking.customerPhone)) {
        byPhone.set(booking.customerPhone, {
          name: booking.customerName,
          phone: booking.customerPhone,
          lastBooking: booking.date.toISOString(),
          lastBookingTime: booking.startTime,
          businessName: booking.business.name,
        });
      }
      return byPhone;
    }, new Map<string, {
      name: string;
      phone: string;
      lastBooking: string;
      lastBookingTime: string;
      businessName: string;
    }>()).values()
  );

  return NextResponse.json({ customers });
}
