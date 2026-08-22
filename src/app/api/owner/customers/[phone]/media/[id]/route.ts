import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { normalizePhone } from '@/lib/identity';
import { requireShopAccess, shopErrorResponse } from '@/lib/shop-access';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { phone: string; id: string } }
) {
  try {
    const ctx = await requireShopAccess('customers', 'EDIT');
    const phone = normalizePhone(decodeURIComponent(params.phone));
    const item = await prisma.customerMedia.findFirst({
      where: { id: params.id, ownerId: ctx.ownerId, phone },
    });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.customerMedia.delete({ where: { id: item.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
