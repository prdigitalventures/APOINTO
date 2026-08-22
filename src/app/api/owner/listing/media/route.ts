import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { parseMediaPayload, publicMedia } from '@/lib/media';
import { assertBusinessInScope, requireShopAccess, shopErrorResponse } from '@/lib/shop-access';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireShopAccess('listing', 'READ');
    const businessId = req.nextUrl.searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    await assertBusinessInScope(ctx, businessId);
    const media = await prisma.shopMedia.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ media: media.map(publicMedia) });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireShopAccess('listing', 'EDIT');
    const body = await req.json();
    const businessId = typeof body.businessId === 'string' ? body.businessId : '';
    if (!businessId) return NextResponse.json({ error: 'Select a shop.' }, { status: 400 });
    await assertBusinessInScope(ctx, businessId);
    const parsed = parseMediaPayload(body);
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const count = await prisma.shopMedia.count({ where: { businessId } });
    if (count >= 16) return NextResponse.json({ error: 'Remove an older photo or video first (16 max).' }, { status: 400 });
    const media = await prisma.shopMedia.create({
      data: { businessId, kind: parsed.kind, data: parsed.data, caption: parsed.caption },
    });
    return NextResponse.json({ media: publicMedia(media) });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
