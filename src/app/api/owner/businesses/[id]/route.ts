import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { assertBusinessInScope, requireShopAccess, shopErrorResponse } from '@/lib/shop-access';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireShopAccess('listing', 'EDIT');
    await assertBusinessInScope(ctx, params.id);
    const business = await prisma.business.findFirst({
      where: { id: params.id, ownerId: ctx.ownerId },
    });
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim().slice(0, 80);
    if (typeof body.category === 'string' && body.category.trim()) data.category = body.category.trim().slice(0, 40);
    if (typeof body.location === 'string') data.location = body.location.trim().slice(0, 120) || null;
    if (typeof body.description === 'string') data.description = body.description.trim().slice(0, 500) || null;
    if (typeof body.about === 'string') data.about = body.about.trim().slice(0, 2000) || null;
    if (typeof body.contactPhone === 'string') data.contactPhone = body.contactPhone.trim().slice(0, 20) || null;
    if (body.googleBookLinkedAt === null) data.googleBookLinkedAt = null;
    else if (typeof body.googleBookLinkedAt === 'string') {
      const parsed = new Date(body.googleBookLinkedAt);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Invalid Google Book confirmation date.' }, { status: 400 });
      }
      data.googleBookLinkedAt = parsed;
    } else if (body.googleBookLinked === true) data.googleBookLinkedAt = new Date();
    else if (body.googleBookLinked === false) data.googleBookLinkedAt = null;
    if (body.logo === null) data.logo = null;
    else if (typeof body.logo === 'string') {
      if (body.logo.length > 350_000) {
        return NextResponse.json({ error: 'Photo is too large. Try a smaller image.' }, { status: 400 });
      }
      if (body.logo && !body.logo.startsWith('data:image/')) {
        return NextResponse.json({ error: 'Upload a photo file.' }, { status: 400 });
      }
      data.logo = body.logo;
    }

    const updated = await prisma.business.update({
      where: { id: business.id },
      data,
      include: { media: { orderBy: { createdAt: 'desc' } } },
    });

    return NextResponse.json({ business: updated });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
