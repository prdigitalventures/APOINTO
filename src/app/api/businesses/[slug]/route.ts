import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureBusinessCode } from '@/lib/business-code';

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
      ownerUser: { select: { phone: true, name: true } },
    },
  });

  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const uniqueCode = await ensureBusinessCode(business);
  const contactPhone = business.contactPhone || business.ownerUser.phone;

  const parsed = {
    ...business,
    uniqueCode,
    contactPhone,
    bookingSchema: business.bookingSchema ? JSON.parse(business.bookingSchema) : null,
  };

  return NextResponse.json({ business: parsed });
}
