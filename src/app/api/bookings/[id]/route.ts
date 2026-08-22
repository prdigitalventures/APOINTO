import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  notifyBookingAccepted,
  notifyBookingRejected,
  notifyAlternativeTimeSuggested,
  notifyTimeUpdateRequested,
  notifyBusinessRunningLate,
  notifyBookingRescheduled,
  notifyBookingCompleted,
  notifyBookingCancelled,
  notifyTimeRequestAccepted,
  REJECTION_REASONS,
} from '@/lib/notifications';
import { getAlternativeSlots, calculateEndTime } from '@/lib/availability';
import { addMinutesToTime } from '@/lib/utils';
import { allocateReceiptNumber, ensureReceiptNumber } from '@/lib/receipt-code';

function canManageBooking(
  session: { id: string; role: string },
  ownerId: string
): boolean {
  return session.role === 'ADMIN' || session.id === ownerId;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const { action, reason, suggestedTime, additionalMinutes, rejectionReasonId } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { business: true, service: true },
    });
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    switch (action) {
      case 'accept': {
        const updated = await prisma.booking.update({
          where: { id: params.id },
          data: { status: 'CONFIRMED' },
        });
        await notifyBookingAccepted(params.id);
        return NextResponse.json({ booking: updated });
      }

      case 'reject': {
        const reasonObj = REJECTION_REASONS.find((r) => r.id === rejectionReasonId);
        const message = reason || reasonObj?.message || 'Booking was not available.';
        const alternatives = await getAlternativeSlots({
          businessId: booking.businessId,
          serviceId: booking.serviceId,
          staffId: booking.staffId || undefined,
          date: booking.date,
        });
        const updated = await prisma.booking.update({
          where: { id: params.id },
          data: { status: 'REJECTED', rejectionReason: message },
        });
        await notifyBookingRejected(params.id, message, alternatives);
        return NextResponse.json({ booking: updated, alternatives });
      }

      case 'suggest_time': {
        await prisma.bookingRequest.create({
          data: {
            bookingId: params.id,
            requestedBy: 'owner',
            requestedTime: suggestedTime,
            status: 'PENDING',
          },
        });
        const updated = await prisma.booking.update({
          where: { id: params.id },
          data: { status: 'RESCHEDULE_REQUESTED' },
        });
        await notifyAlternativeTimeSuggested(params.id, suggestedTime);
        return NextResponse.json({ booking: updated });
      }

      case 'accept_suggested_time': {
        const endTime = await calculateEndTime(booking.serviceId, suggestedTime || booking.startTime, booking.businessId);
        const updated = await prisma.booking.update({
          where: { id: params.id },
          data: {
            status: 'RESCHEDULED',
            startTime: suggestedTime || booking.startTime,
            endTime,
          },
        });
        await notifyBookingRescheduled(params.id);
        return NextResponse.json({ booking: updated });
      }

      case 'request_time': {
        const requestedBy = body.requestedBy || 'customer';
        await prisma.timeRequest.create({
          data: {
            bookingId: params.id,
            requestedBy,
            additionalMinutes,
            status: 'PENDING',
          },
        });
        const status = requestedBy === 'owner' ? 'TIME_UPDATE_REQUESTED' : 'CUSTOMER_TIME_REQUESTED';
        const updated = await prisma.booking.update({
          where: { id: params.id },
          data: { status },
        });
        await notifyTimeUpdateRequested(params.id, additionalMinutes, requestedBy);
        return NextResponse.json({ booking: updated });
      }

      case 'accept_time_request': {
        const timeReq = await prisma.timeRequest.findFirst({
          where: { bookingId: params.id, status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        });
        if (timeReq) {
          const newStart = addMinutesToTime(booking.startTime, timeReq.additionalMinutes);
          const newEnd = addMinutesToTime(booking.endTime, timeReq.additionalMinutes);
          await prisma.timeRequest.update({ where: { id: timeReq.id }, data: { status: 'ACCEPTED' } });
          const updated = await prisma.booking.update({
            where: { id: params.id },
            data: { status: 'CONFIRMED', startTime: newStart, endTime: newEnd },
          });
          await notifyTimeRequestAccepted(params.id, timeReq.additionalMinutes, timeReq.requestedBy);
          return NextResponse.json({ booking: updated });
        }
        return NextResponse.json({ error: 'No pending time request' }, { status: 400 });
      }

      case 'running_late': {
        const updated = await prisma.booking.update({
          where: { id: params.id },
          data: { status: 'DELAYED' },
        });
        await notifyBusinessRunningLate(params.id, additionalMinutes || 15);
        return NextResponse.json({ booking: updated });
      }

      case 'complete': {
        const updated = await prisma.booking.update({
          where: { id: params.id },
          data: { status: 'COMPLETED' },
        });
        await notifyBookingCompleted(params.id);
        return NextResponse.json({ booking: updated });
      }

      case 'mark_paid': {
        if (!canManageBooking(session, booking.business.ownerId)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const receiptNumber = booking.receiptNumber || (await allocateReceiptNumber(booking.createdAt));
        const requestedMode = typeof body.paymentMode === 'string' ? body.paymentMode.trim().slice(0, 40) : '';
        const paymentMode = requestedMode || booking.paymentMode || 'offline';
        const updated = await prisma.booking.update({
          where: { id: params.id },
          data: {
            receiptNumber,
            paymentMode,
            paidAt: booking.paidAt || new Date(),
          },
          include: { service: true, staff: true, business: true },
        });
        return NextResponse.json({ booking: updated });
      }

      case 'ensure_receipt': {
        if (!canManageBooking(session, booking.business.ownerId)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        await ensureReceiptNumber(params.id);
        const updated = await prisma.booking.findUnique({
          where: { id: params.id },
          include: { service: true, staff: true, business: true },
        });
        return NextResponse.json({ booking: updated });
      }

      case 'cancel': {
        const updated = await prisma.booking.update({
          where: { id: params.id },
          data: { status: 'CANCELLED' },
        });
        await notifyBookingCancelled(params.id);
        return NextResponse.json({ booking: updated });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      service: true,
      staff: true,
      business: true,
      timeRequests: { orderBy: { createdAt: 'desc' } },
      bookingRequests: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ booking });
}
