import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, requireVerifiedCustomer } from '@/lib/auth';
import { isSlotAvailable, calculateEndTime } from '@/lib/availability';
import { notifyNewBookingRequest } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();
    const { businessId, serviceId, staffId, date, startTime, customerName, customerPhone, customData, isWalkIn } = body;

    if (isWalkIn) {
      if (!session || session.role !== 'OWNER') {
        return NextResponse.json({ error: 'Only business owners can add walk-ins' }, { status: 403 });
      }
    } else {
      const gate = await requireVerifiedCustomer(session);
      if (!gate.ok) {
        return NextResponse.json({ error: gate.error }, { status: gate.status });
      }
    }

    const available = await isSlotAvailable({
      businessId,
      serviceId,
      staffId,
      date: new Date(date),
      startTime,
    });

    if (!available && !isWalkIn) {
      return NextResponse.json({ error: 'Slot no longer available' }, { status: 409 });
    }

    const endTime = await calculateEndTime(serviceId, startTime, businessId);

    const booking = await prisma.booking.create({
      data: {
        businessId,
        customerId: session?.id,
        serviceId,
        staffId: staffId || null,
        customerName,
        customerPhone,
        date: new Date(date),
        startTime,
        endTime,
        status: isWalkIn ? 'CONFIRMED' : 'PENDING',
        isWalkIn: !!isWalkIn,
        customData: customData ? JSON.stringify(customData) : null,
      },
      include: { service: true, staff: true, business: true },
    });

    if (!isWalkIn) {
      await notifyNewBookingRequest(booking.id);
    }

    return NextResponse.json({ booking });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  const role = searchParams.get('role') || 'customer';

  if (role === 'owner' && businessId) {
    const bookings = await prisma.booking.findMany({
      where: { businessId },
      include: { service: true, staff: true, customer: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    return NextResponse.json({ bookings });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { customerId: session.id },
        { customerPhone: session.phone },
      ],
      status: { notIn: ['CANCELLED', 'REJECTED'] },
      date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
    include: { service: true, staff: true, business: true },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  return NextResponse.json({ bookings });
}
