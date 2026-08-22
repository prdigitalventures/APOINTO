import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { assertBusinessInScope, requireShopAccess, shopErrorResponse } from '@/lib/shop-access';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireShopAccess('services', 'READ');
    const businessId = req.nextUrl.searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    await assertBusinessInScope(ctx, businessId);
    const services = await prisma.service.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json({ services });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireShopAccess('services', 'EDIT');
    const body = await req.json();
    const businessId = typeof body.businessId === 'string' ? body.businessId : '';
    if (!businessId) return NextResponse.json({ error: 'Select a shop.' }, { status: 400 });
    await assertBusinessInScope(ctx, businessId);

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length < 2) return NextResponse.json({ error: 'Enter a service name.' }, { status: 400 });
    const price = Number(body.price);
    const duration = Number(body.duration);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: 'Enter a valid price.' }, { status: 400 });
    }
    if (!Number.isFinite(duration) || duration < 5) {
      return NextResponse.json({ error: 'Duration must be at least 5 minutes.' }, { status: 400 });
    }

    const count = await prisma.service.count({ where: { businessId } });
    const service = await prisma.service.create({
      data: {
        businessId,
        name: name.slice(0, 80),
        description: typeof body.description === 'string' ? body.description.trim().slice(0, 400) || null : null,
        price,
        duration: Math.round(duration),
        isActive: true,
        sortOrder: count,
      },
    });
    return NextResponse.json({ service });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
