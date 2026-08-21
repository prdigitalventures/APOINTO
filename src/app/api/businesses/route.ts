import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { allocateUniqueCode, ensureBusinessCode } from '@/lib/business-code';

export async function GET() {
  const session = await requireSession();
  const businesses = await prisma.business.findMany({
    where: { ownerId: session.id },
    include: {
      services: { where: { isActive: true } },
      staff: { where: { isActive: true } },
      ownerUser: { select: { phone: true, name: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const withCodes = await Promise.all(
    businesses.map(async (biz) => {
      const uniqueCode = await ensureBusinessCode(biz);
      const contactPhone = biz.contactPhone || biz.ownerUser.phone;
      if (!biz.contactPhone) {
        await prisma.business.update({
          where: { id: biz.id },
          data: { contactPhone },
        });
      }
      return { ...biz, uniqueCode, contactPhone };
    })
  );

  return NextResponse.json({ businesses: withCodes });
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const data = await req.json();
    const { slugify } = await import('@/lib/utils');
    const { getBookingSchema } = await import('@/lib/booking-schema');

    let slug = slugify(data.name);
    const existing = await prisma.business.findUnique({ where: { slug } });
    if (existing) slug = `${slug}${Date.now().toString(36)}`;

    const schema = getBookingSchema(data.category || 'beauty');
    const uniqueCode = await allocateUniqueCode();

    const business = await prisma.business.create({
      data: {
        ownerId: session.id,
        name: data.name,
        slug,
        category: data.category || 'beauty',
        location: data.location,
        description: data.description,
        about: data.about,
        bookingSchema: JSON.stringify(schema),
        uniqueCode,
        contactPhone: data.contactPhone || session.phone,
      },
    });

    return NextResponse.json({ business });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

