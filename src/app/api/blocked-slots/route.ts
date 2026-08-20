import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const { businessId, staffId, date, startTime, endTime, reason } = await req.json();

    const block = await prisma.blockedSlot.create({
      data: {
        businessId,
        staffId: staffId || null,
        date: new Date(date),
        startTime,
        endTime,
        reason,
      },
    });

    return NextResponse.json({ block });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: session.id },
  });
  if (!business) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const blocks = await prisma.blockedSlot.findMany({
    where: { businessId },
    orderBy: { date: 'asc' },
  });
  return NextResponse.json({ blocks });
}
