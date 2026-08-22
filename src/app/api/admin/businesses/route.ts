import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminError, requirePermission, writeAudit } from '@/lib/admin';
import { createBusinessForOwner } from '@/lib/admin-business';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requirePermission('businesses', 'READ');
    const q = req.nextUrl.searchParams.get('q')?.trim() || '';
    const status = req.nextUrl.searchParams.get('status') || '';

    const businesses = await prisma.business.findMany({
      where: {
        ...(status === 'disabled' ? { isActive: false } : status === 'active' ? { isActive: true } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { slug: { contains: q, mode: 'insensitive' } },
                { uniqueCode: { contains: q, mode: 'insensitive' } },
                { ownerUser: { email: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        ownerUser: { select: { id: true, name: true, email: true, phone: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ businesses });
  } catch (error) {
    return adminError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const staff = await requirePermission('businesses', 'EDIT');
    const body = await req.json();
    const result = await createBusinessForOwner({
      name: body.name,
      category: body.category,
      location: body.location,
      description: body.description,
      about: body.about,
      ownerEmail: body.ownerEmail,
      ownerName: body.ownerName,
      ownerPhone: body.ownerPhone,
    });

    await writeAudit({
      actorId: staff.session.id,
      action: 'business.create',
      targetType: 'business',
      targetId: result.business.id,
      metadata: { ownerEmail: body.ownerEmail, invited: result.invited },
    });

    return NextResponse.json(result);
  } catch (error) {
    return adminError(error);
  }
}
