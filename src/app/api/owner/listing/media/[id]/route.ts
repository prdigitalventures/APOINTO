import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireShopAccess, shopErrorResponse } from '@/lib/shop-access';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireShopAccess('listing', 'EDIT');
    const item = await prisma.shopMedia.findUnique({
      where: { id: params.id },
      include: { business: { select: { ownerId: true, id: true } } },
    });
    if (!item || item.business.ownerId !== ctx.ownerId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (!ctx.isOwner && !ctx.businessIds.includes(item.businessId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await prisma.shopMedia.delete({ where: { id: item.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
