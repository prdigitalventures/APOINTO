import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { normalizePhone } from '@/lib/identity';
import { buildCrmList } from '@/lib/owner-crm';
import { requireShopAccess, shopErrorResponse } from '@/lib/shop-access';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireShopAccess('customers', 'READ');
    const q = req.nextUrl.searchParams.get('q') || undefined;
    const businessId = req.nextUrl.searchParams.get('businessId') || undefined;
    const customers = await buildCrmList(ctx.ownerId, { q, businessId });
    return NextResponse.json({ customers });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireShopAccess('customers', 'EDIT');
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const phone = normalizePhone(typeof body.phone === 'string' ? body.phone : '');
    const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 2000) : '';

    if (name.length < 2) {
      return NextResponse.json({ error: 'Enter the customer name.' }, { status: 400 });
    }
    if (phone.length !== 10) {
      return NextResponse.json({ error: 'Enter a 10-digit mobile number.' }, { status: 400 });
    }

    const contact = await prisma.crmContact.upsert({
      where: { ownerId_phone: { ownerId: ctx.ownerId, phone } },
      create: { ownerId: ctx.ownerId, phone, name, notes: notes || null },
      update: { name, notes: notes || undefined },
    });

    return NextResponse.json({ customer: { phone: contact.phone, name: contact.name } });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
