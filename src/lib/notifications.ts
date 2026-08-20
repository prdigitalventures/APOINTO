import { prisma } from './db';

export type NotificationType =
  | 'NEW_BOOKING_REQUEST'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_REJECTED'
  | 'ALTERNATIVE_TIME_SUGGESTED'
  | 'TIME_UPDATE_REQUESTED'
  | 'CUSTOMER_RUNNING_LATE'
  | 'BUSINESS_RUNNING_LATE'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_RESCHEDULED'
  | 'APPOINTMENT_REMINDER'
  | 'TIME_REQUEST_ACCEPTED'
  | 'TIME_REQUEST_REJECTED';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export async function sendNotification(payload: NotificationPayload) {
  const notification = await prisma.notification.create({
    data: {
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data ? JSON.stringify(payload.data) : null,
    },
  });

  // Phase 1: in-app notifications only
  // Future: integrate SMS, WhatsApp, push, email providers
  console.log(`[Notification] ${payload.type}: ${payload.title} -> ${payload.userId}`);

  return notification;
}

export async function notifyNewBookingRequest(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { business: true, service: true, staff: true },
  });
  if (!booking) return;

  await sendNotification({
    userId: booking.business.ownerId,
    type: 'NEW_BOOKING_REQUEST',
    title: '🔔 New booking request',
    message: `${booking.customerName} requested ${booking.service.name}${booking.staff ? ` with ${booking.staff.name}` : ''} at ${formatTime(booking.startTime)}`,
    data: { bookingId: booking.id },
  });
}

export async function notifyBookingAccepted(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { business: true, service: true, staff: true, customer: true },
  });
  if (!booking || !booking.customerId) return;

  await sendNotification({
    userId: booking.customerId,
    type: 'BOOKING_ACCEPTED',
    title: '✅ Appointment Confirmed',
    message: `${booking.business.name} - ${booking.service.name}${booking.staff ? ` with ${booking.staff.name}` : ''} at ${formatTime(booking.startTime)}`,
    data: { bookingId: booking.id },
  });
}

export async function notifyBookingRejected(bookingId: string, reason: string, alternatives?: string[]) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { business: true, service: true, customer: true },
  });
  if (!booking || !booking.customerId) return;

  let message = reason;
  if (alternatives?.length) {
    message += `. Available slots: ${alternatives.map(formatTime).join(', ')}`;
  }

  await sendNotification({
    userId: booking.customerId,
    type: 'BOOKING_REJECTED',
    title: 'Booking Update',
    message,
    data: { bookingId: booking.id, alternatives },
  });
}

export async function notifyTimeUpdateRequested(bookingId: string, minutes: number, requestedBy: 'owner' | 'customer') {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { business: true, customer: true },
  });
  if (!booking) return;

  const newTime = addMinutes(booking.startTime, minutes);
  const recipientId = requestedBy === 'owner' ? booking.customerId : booking.business.ownerId;
  if (!recipientId) return;

  await sendNotification({
    userId: recipientId,
    type: 'TIME_UPDATE_REQUESTED',
    title: '⏱️ Time update requested',
    message: `Additional ${minutes} minutes requested. Updated time: ${formatTime(newTime)}`,
    data: { bookingId: booking.id, additionalMinutes: minutes },
  });
}

export async function notifyBusinessRunningLate(bookingId: string, minutes: number) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { business: true, customer: true },
  });
  if (!booking || !booking.customerId) return;

  const newTime = addMinutes(booking.startTime, minutes);
  await sendNotification({
    userId: booking.customerId,
    type: 'BUSINESS_RUNNING_LATE',
    title: '⏱️ Appointment Update',
    message: `Your appointment is running approximately ${minutes} minutes late. Updated time: ${formatTime(newTime)}`,
    data: { bookingId: booking.id },
  });
}

export async function notifyAlternativeTimeSuggested(bookingId: string, suggestedTime: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { business: true, customer: true },
  });
  if (!booking || !booking.customerId) return;

  await sendNotification({
    userId: booking.customerId,
    type: 'ALTERNATIVE_TIME_SUGGESTED',
    title: 'Alternative time suggested',
    message: `${booking.business.name} suggested ${formatTime(suggestedTime)} instead.`,
    data: { bookingId: booking.id, suggestedTime },
  });
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

export const REJECTION_REASONS = [
  { id: 'not_available', label: 'Not available', message: 'This time is unavailable.' },
  { id: 'offline_conflict', label: 'Offline booking conflict', message: 'This time is unavailable because the business has another appointment.' },
  { id: 'staff_unavailable', label: 'Staff unavailable', message: 'The selected staff member is not available at this time.' },
  { id: 'lunch_time', label: 'Lunch time', message: 'This time falls during lunch break.' },
  { id: 'break_time', label: 'Break time', message: 'This time falls during a scheduled break.' },
  { id: 'fully_booked', label: 'Fully booked', message: 'All slots are fully booked for this time.' },
  { id: 'temporary_closure', label: 'Temporary closure', message: 'The business is temporarily closed.' },
  { id: 'service_unavailable', label: 'Service unavailable', message: 'This service is currently unavailable.' },
  { id: 'closing_time', label: 'Closing time', message: 'This time is too close to closing time.' },
  { id: 'book_later', label: 'Please book later', message: 'Please try booking at a later time.' },
];
