import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireOwner } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { normalizePhone } from '@/lib/identity';
import { buildCrmDetail } from '@/lib/owner-crm';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { phone: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const customer = await buildCrmDetail(session.id, decodeURIComponent(params.phone));
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ customer });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const session = await requireOwner();
    const phone = normalizePhone(decodeURIComponent(params.phone));
    if (phone.length !== 10) {
      return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });
    }

    const body = await req.json();
    const existing = await prisma.crmContact.findUnique({
      where: { ownerId_phone: { ownerId: session.id, phone } },
    });
    const detail = await buildCrmDetail(session.id, phone);
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

    await prisma.crmContact.upsert({
      where: { ownerId_phone: { ownerId: session.id, phone } },
      create: { ownerId: session.id, phone, name, notes, statusOverride },
      update: { name, notes, statusOverride },
    });

    const customer = await buildCrmDetail(session.id, phone);
    return NextResponse.json({ customer });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
