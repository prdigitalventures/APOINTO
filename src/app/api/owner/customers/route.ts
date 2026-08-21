import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireOwner } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { normalizePhone } from '@/lib/identity';
import { buildCrmList } from '@/lib/owner-crm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const q = req.nextUrl.searchParams.get('q') || undefined;
  const businessId = req.nextUrl.searchParams.get('businessId') || undefined;
  const customers = await buildCrmList(session.id, { q, businessId });
  return NextResponse.json({ customers });
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireOwner();
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
      where: { ownerId_phone: { ownerId: session.id, phone } },
      create: { ownerId: session.id, phone, name, notes: notes || null },
      update: { name, notes: notes || undefined },
    });

    return NextResponse.json({ customer: { phone: contact.phone, name: contact.name } });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
