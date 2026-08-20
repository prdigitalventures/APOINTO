import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    include: {
      services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      staff: {
        where: { isActive: true },
        include: { staffServices: { include: { service: true } } },
      },
      businessHours: { orderBy: { day: 'asc' } },
      breaks: true,
    },
  });

  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const parsed = {
    ...business,
    bookingSchema: business.bookingSchema ? JSON.parse(business.bookingSchema) : null,
  };

  return NextResponse.json({ business: parsed });
}
