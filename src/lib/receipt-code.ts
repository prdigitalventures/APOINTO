import { prisma } from './db';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSuffix(length = 5): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** Same algorithm as business unique codes: PR + YYMM + 5 chars. */
export async function allocateReceiptNumber(createdAt = new Date()): Promise<string> {
  const yy = String(createdAt.getFullYear()).slice(-2);
  const mm = String(createdAt.getMonth() + 1).padStart(2, '0');
  for (let attempt = 0; attempt < 16; attempt++) {
    const code = `PR${yy}${mm}${randomSuffix()}`;
    const exists = await prisma.booking.findUnique({ where: { receiptNumber: code } });
    if (!exists) return code;
  }
  return `PR${yy}${mm}${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

export async function ensureReceiptNumber(bookingId: string): Promise<string> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, receiptNumber: true, createdAt: true },
  });
  if (!booking) throw new Error('Not found');
  if (booking.receiptNumber) return booking.receiptNumber;
  const receiptNumber = await allocateReceiptNumber(booking.createdAt);
  await prisma.booking.update({ where: { id: booking.id }, data: { receiptNumber } });
  return receiptNumber;
}
