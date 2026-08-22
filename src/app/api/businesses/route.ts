import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { allocateUniqueCode, ensureBusinessCode } from '@/lib/business-code';
import { loadShopContext, shopErrorResponse } from '@/lib/shop-access';

export async function GET() {
  try {
    const ctx = await loadShopContext();
    const businesses = await prisma.business.findMany({
      where: ctx.isOwner ? { ownerId: ctx.ownerId } : { id: { in: ctx.businessIds } },
      include: {
        services: { orderBy: { sortOrder: 'asc' } },
        staff: { orderBy: { name: 'asc' } },
        media: { orderBy: { createdAt: 'desc' } },
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

    return NextResponse.json({
      businesses: withCodes,
      shop: { isOwner: ctx.isOwner, privileges: ctx.privileges },
    });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only the shop owner can create a business.' }, { status: 403 });
    }
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

