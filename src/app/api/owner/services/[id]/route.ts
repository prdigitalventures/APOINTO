import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { assertBusinessInScope, requireShopAccess, shopErrorResponse } from '@/lib/shop-access';

async function loadOwnedService(id: string, ownerId: string, businessIds: string[], isOwner: boolean) {
  const service = await prisma.service.findUnique({
    where: { id },
    include: { business: { select: { id: true, ownerId: true } } },
  });
  if (!service || service.business.ownerId !== ownerId) return null;
  if (!isOwner && !businessIds.includes(service.businessId)) return null;
  return service;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireShopAccess('services', 'EDIT');
    const service = await loadOwnedService(params.id, ctx.ownerId, ctx.businessIds, ctx.isOwner);
    if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await assertBusinessInScope(ctx, service.businessId);

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body.name === 'string' && body.name.trim().length >= 2) data.name = body.name.trim().slice(0, 80);
    if (typeof body.description === 'string') data.description = body.description.trim().slice(0, 400) || null;
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: 'Enter a valid price.' }, { status: 400 });
      }
      data.price = price;
    }
    if (body.duration !== undefined) {
      const duration = Number(body.duration);
      if (!Number.isFinite(duration) || duration < 5) {
        return NextResponse.json({ error: 'Duration must be at least 5 minutes.' }, { status: 400 });
      }
      data.duration = Math.round(duration);
    }
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive;

    const updated = await prisma.service.update({ where: { id: service.id }, data });
    return NextResponse.json({ service: updated });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireShopAccess('services', 'EDIT');
    const service = await loadOwnedService(params.id, ctx.ownerId, ctx.businessIds, ctx.isOwner);
    if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.service.update({ where: { id: service.id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
