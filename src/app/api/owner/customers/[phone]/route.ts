import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { normalizePhone } from '@/lib/identity';
import { buildCrmDetail } from '@/lib/owner-crm';
import { requireShopAccess, shopErrorResponse } from '@/lib/shop-access';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const ctx = await requireShopAccess('customers', 'READ');
    const customer = await buildCrmDetail(ctx.ownerId, decodeURIComponent(params.phone));
    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ customer });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const ctx = await requireShopAccess('customers', 'EDIT');
    const phone = normalizePhone(decodeURIComponent(params.phone));
    if (phone.length !== 10) {
      return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });
    }

    const body = await req.json();
    const existing = await prisma.crmContact.findUnique({
      where: { ownerId_phone: { ownerId: ctx.ownerId, phone } },
    });
    const detail = await buildCrmDetail(ctx.ownerId, phone);
    if (!existing && !detail) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const name =
      typeof body.name === 'string' && body.name.trim().length >= 2
        ? body.name.trim().slice(0, 80)
        : existing?.name || detail?.name || 'Customer';
    const notes =
      typeof body.notes === 'string' ? body.notes.trim().slice(0, 2000) || null : existing?.notes;
    let statusOverride = existing?.statusOverride || null;
    if (body.statusOverride === null || body.statusOverride === 'AUTO') statusOverride = null;
    else if (['NEW', 'REGULAR', 'INACTIVE'].includes(body.statusOverride)) {
      statusOverride = body.statusOverride;
    }
    const email =
      typeof body.email === 'string' ? body.email.trim().slice(0, 120) || null : existing?.email;
    const address =
      typeof body.address === 'string' ? body.address.trim().slice(0, 200) || null : existing?.address;
    const birthday =
      typeof body.birthday === 'string' ? body.birthday.trim().slice(0, 20) || null : existing?.birthday;
    const tags =
      typeof body.tags === 'string' ? body.tags.trim().slice(0, 120) || null : existing?.tags;
    const lastWorkNotes =
      typeof body.lastWorkNotes === 'string'
        ? body.lastWorkNotes.trim().slice(0, 2000) || null
        : existing?.lastWorkNotes;

    await prisma.crmContact.upsert({
      where: { ownerId_phone: { ownerId: ctx.ownerId, phone } },
      create: {
        ownerId: ctx.ownerId,
        phone,
        name,
        notes,
        statusOverride,
        email,
        address,
        birthday,
        tags,
        lastWorkNotes,
      },
      update: { name, notes, statusOverride, email, address, birthday, tags, lastWorkNotes },
    });

    const customer = await buildCrmDetail(ctx.ownerId, phone);
    return NextResponse.json({ customer });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
