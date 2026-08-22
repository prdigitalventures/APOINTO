import { prisma } from './db';
import { applyStatusOverride, crmStatus, type CrmStatus } from './crm';
import { normalizePhone } from './identity';

export interface CrmCustomerListItem {
  phone: string;
  name: string;
  lastBooking: string | null;
  lastBookingTime: string | null;
  lastServiceName: string | null;
  businessName: string | null;
  businessId: string | null;
  visitCount: number;
  status: CrmStatus;
  statusOverride: string | null;
  notes: string | null;
}

interface Visit {
  phone: string;
  name: string;
  date: Date;
  startTime: string;
  serviceName: string;
  staffName: string | null;
  status: string;
  isWalkIn: boolean;
  businessName: string;
  businessId: string;
  bookingNotes: string | null;
}

export async function loadOwnerVisits(ownerId: string, businessId?: string): Promise<Visit[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      business: {
        ownerId,
        ...(businessId ? { id: businessId } : {}),
      },
    },
    select: {
      customerName: true,
      customerPhone: true,
      date: true,
      startTime: true,
      status: true,
      isWalkIn: true,
      notes: true,
      service: { select: { name: true } },
      staff: { select: { name: true } },
      business: { select: { id: true, name: true } },
    },
    orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
  });

  return bookings.map((b) => ({
    phone: normalizePhone(b.customerPhone),
    name: b.customerName,
    date: b.date,
    startTime: b.startTime,
    serviceName: b.service.name,
    staffName: b.staff?.name || null,
    status: b.status,
    isWalkIn: b.isWalkIn,
    businessName: b.business.name,
    businessId: b.business.id,
    bookingNotes: b.notes,
  }));
}

export async function buildCrmList(
  ownerId: string,
  opts: { q?: string; businessId?: string } = {}
): Promise<CrmCustomerListItem[]> {
  const [visits, contacts] = await Promise.all([
    loadOwnerVisits(ownerId, opts.businessId),
    prisma.crmContact.findMany({ where: { ownerId } }),
  ]);

  const byPhone = new Map<
    string,
    {
      name: string;
      visits: Visit[];
      contact?: (typeof contacts)[number];
    }
  >();

  for (const visit of visits) {
    const existing = byPhone.get(visit.phone);
    if (existing) {
      existing.visits.push(visit);
      if (!existing.name) existing.name = visit.name;
    } else {
      byPhone.set(visit.phone, { name: visit.name, visits: [visit] });
    }
  }

  for (const contact of contacts) {
    const phone = normalizePhone(contact.phone);
    const existing = byPhone.get(phone);
    if (existing) {
      existing.contact = contact;
      if (contact.name) existing.name = contact.name;
    } else if (!opts.businessId) {
      byPhone.set(phone, { name: contact.name, visits: [], contact });
    }
  }

  const q = (opts.q || '').trim().toLowerCase();

  const rows: CrmCustomerListItem[] = [];
  for (const [phone, row] of byPhone) {
    const last = row.visits[0];
    const lastDate = last?.date || null;
    const auto = crmStatus(row.visits.length, lastDate);
    const status = applyStatusOverride(auto, row.contact?.statusOverride);
    const item: CrmCustomerListItem = {
      phone,
      name: row.name,
      lastBooking: lastDate ? lastDate.toISOString() : null,
      lastBookingTime: last?.startTime || null,
      lastServiceName: last?.serviceName || null,
      businessName: last?.businessName || null,
      businessId: last?.businessId || null,
      visitCount: row.visits.length,
      status,
      statusOverride: row.contact?.statusOverride || null,
      notes: row.contact?.notes || null,
    };
    if (q) {
      const digits = q.replace(/\D/g, '');
      const matchName = item.name.toLowerCase().includes(q);
      const matchPhone = digits ? item.phone.includes(digits) : false;
      const matchBiz = (item.businessName || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchBiz) continue;
    }
    rows.push(item);
  }

  rows.sort((a, b) => {
    if (a.lastBooking && b.lastBooking) return b.lastBooking.localeCompare(a.lastBooking);
    if (a.lastBooking) return -1;
    if (b.lastBooking) return 1;
    return a.name.localeCompare(b.name);
  });

  return rows;
}

export async function buildCrmDetail(ownerId: string, rawPhone: string) {
  const phone = normalizePhone(rawPhone);
  if (phone.length < 10) return null;

  const [visits, contact] = await Promise.all([
    loadOwnerVisits(ownerId).then((all) => all.filter((v) => v.phone === phone)),
    prisma.crmContact.findUnique({
      where: { ownerId_phone: { ownerId, phone } },
    }),
  ]);

  if (!visits.length && !contact) return null;

  const last = visits[0];
  const auto = crmStatus(visits.length, last?.date || null);

  return {
    phone,
    name: contact?.name || last?.name || 'Customer',
    notes: contact?.notes || '',
    status: applyStatusOverride(auto, contact?.statusOverride),
    statusOverride: contact?.statusOverride || null,
    visitCount: visits.length,
    lastBooking: last?.date?.toISOString() || null,
    lastBookingTime: last?.startTime || null,
    lastServiceName: last?.serviceName || null,
    businessName: last?.businessName || null,
    history: visits.map((v) => ({
      date: v.date.toISOString(),
      startTime: v.startTime,
      serviceName: v.serviceName,
      staffName: v.staffName,
      status: v.status,
      isWalkIn: v.isWalkIn,
      businessName: v.businessName,
      notes: v.bookingNotes,
    })),
    email: contact?.email || '',
    address: contact?.address || '',
    birthday: contact?.birthday || '',
    tags: contact?.tags || '',
    lastWorkNotes: contact?.lastWorkNotes || '',
    media: (await prisma.customerMedia.findMany({
      where: { ownerId, phone },
      orderBy: { createdAt: 'desc' },
      take: 24,
    })).map((m) => ({
      id: m.id,
      kind: m.kind,
      data: m.data,
      caption: m.caption,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}
