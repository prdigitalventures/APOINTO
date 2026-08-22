import { prisma } from './db';
import { timeToMinutes, minutesToTime, addMinutesToTime } from './utils';
import { format, getDay, isSameDay } from 'date-fns';

interface SlotParams {
  businessId: string;
  serviceId: string;
  staffId?: string;
  date: Date;
}

export async function getAvailableSlots(params: SlotParams): Promise<string[]> {
  const { businessId, serviceId, staffId, date } = params;

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return [];

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { businessHours: true, breaks: true, holidays: true },
  });
  if (!business) return [];

  const dayOfWeek = getDay(date);

  const holiday = business.holidays.find((h) => isSameDay(h.date, date));
  if (holiday) return [];

  const businessHour = business.businessHours.find((h) => h.day === dayOfWeek);
  if (!businessHour || businessHour.isClosed) return [];

  let openTime = businessHour.openingTime;
  let closeTime = businessHour.closingTime;

  if (staffId) {
    const staffHour = await prisma.staffHour.findUnique({
      where: { staffId_day: { staffId, day: dayOfWeek } },
    });
    if (staffHour) {
      if (staffHour.isClosed) return [];
      openTime = staffHour.openingTime;
      closeTime = staffHour.closingTime;
    }
  }

  const duration = service.duration + service.bufferBefore + service.bufferAfter + business.bufferMinutes;
  const slotInterval = 30;

  const dayBreaks = business.breaks.filter((b) => b.day === null || b.day === dayOfWeek);

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingBookings = await prisma.booking.findMany({
    where: {
      businessId,
      date: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ['CANCELLED', 'REJECTED'] },
      ...(staffId ? { staffId } : {}),
    },
  });

  const blockedSlots = await prisma.blockedSlot.findMany({
    where: {
      businessId,
      date: { gte: startOfDay, lte: endOfDay },
      ...(staffId ? { OR: [{ staffId }, { staffId: null }] } : {}),
    },
  });

  const slots: string[] = [];
  let current = timeToMinutes(openTime);
  const close = timeToMinutes(closeTime);

  while (current + duration <= close) {
    const slotStart = minutesToTime(current);

    const inBreak = dayBreaks.some((b) => {
      const breakStart = timeToMinutes(b.startTime);
      const breakEnd = timeToMinutes(b.endTime);
      return current < breakEnd && current + duration > breakStart;
    });

    const hasConflict = existingBookings.some((booking) => {
      const bookingStart = timeToMinutes(booking.startTime);
      const bookingEnd = timeToMinutes(booking.endTime);
      return current < bookingEnd && current + duration > bookingStart;
    });

    const isBlocked = blockedSlots.some((block) => {
      const blockStart = timeToMinutes(block.startTime);
      const blockEnd = timeToMinutes(block.endTime);
      return current < blockEnd && current + duration > blockStart;
    });

    if (!inBreak && !hasConflict && !isBlocked) {
      slots.push(slotStart);
    }

    current += slotInterval;
  }

  return slots;
}

export async function isSlotAvailable(params: SlotParams & { startTime: string }): Promise<boolean> {
  const slots = await getAvailableSlots(params);
  return slots.includes(params.startTime);
}

export async function calculateEndTime(serviceId: string, startTime: string, businessId: string): Promise<string> {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!service) return startTime;

  const totalMinutes = service.duration + service.bufferAfter + (business?.bufferMinutes || 0);
  return addMinutesToTime(startTime, totalMinutes);
}

export async function getAlternativeSlots(
  params: SlotParams,
  count: number = 3
): Promise<string[]> {
  const slots = await getAvailableSlots(params);
  return slots.slice(0, count);
}

export function formatBookingDateTime(date: Date, time: string): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const timeStr = formatTimeDisplay(time);

  if (isSameDay(date, today)) return `Today · ${timeStr}`;
  if (isSameDay(date, tomorrow)) return `Tomorrow · ${timeStr}`;
  return `${format(date, 'EEE, MMM d')} · ${timeStr}`;
}

function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}
