import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { normalizePhone } from '@/lib/identity';
import { parseMediaPayload, publicMedia } from '@/lib/media';
import { requireShopAccess, shopErrorResponse } from '@/lib/shop-access';
import { buildCrmDetail } from '@/lib/owner-crm';

export async function POST(req: NextRequest, { params }: { params: { phone: string } }) {
  try {
    const ctx = await requireShopAccess('customers', 'EDIT');
    const phone = normalizePhone(decodeURIComponent(params.phone));
    if (phone.length !== 10) return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });
    const detail = await buildCrmDetail(ctx.ownerId, phone);
    if (!detail) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const parsed = parseMediaPayload(await req.json());
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const count = await prisma.customerMedia.count({ where: { ownerId: ctx.ownerId, phone } });
    if (count >= 16) return NextResponse.json({ error: 'Remove an older file first (16 max).' }, { status: 400 });
    const media = await prisma.customerMedia.create({
      data: {
        ownerId: ctx.ownerId,
        phone,
        kind: parsed.kind,
        data: parsed.data,
        caption: parsed.caption,
      },
    });
    return NextResponse.json({ media: publicMedia(media) });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
