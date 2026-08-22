import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { compactReceiptCode, toReceiptView } from '@/lib/receipt-format';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = compactReceiptCode(decodeURIComponent(params.code || ''));
  if (!code) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const booking = await prisma.booking.findUnique({
    where: { receiptNumber: code },
    include: { service: true, business: true },
  });
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const session = await getSession();
  const isOwner =
    session &&
    (session.role === 'ADMIN' || session.id === booking.business.ownerId);
  if (!booking.paidAt && !isOwner) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const receipt = toReceiptView(booking);
  if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ receipt });
}
