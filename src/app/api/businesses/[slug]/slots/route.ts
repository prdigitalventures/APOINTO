import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAvailableSlots } from '@/lib/availability';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get('serviceId');
  const staffId = searchParams.get('staffId') || undefined;
  const dateStr = searchParams.get('date');

  if (!serviceId || !dateStr) {
    return NextResponse.json({ error: 'serviceId and date required' }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { slug: params.slug } });
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const slots = await getAvailableSlots({
    businessId: business.id,
    serviceId,
    staffId,
    date: new Date(dateStr),
  });

  return NextResponse.json({ slots });
}
