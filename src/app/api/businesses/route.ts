import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await requireSession();
  const businesses = await prisma.business.findMany({
    where: { ownerId: session.id },
    include: {
      services: { where: { isActive: true } },
      staff: { where: { isActive: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ businesses });
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
      },
    });

    return NextResponse.json({ business });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
