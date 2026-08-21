import { addDays, format, getDay, isSameDay, isToday, isTomorrow } from 'date-fns';
import { prisma } from './db';
import { getAvailableSlots } from './availability';
import { DAYS, formatTime12h } from './utils';

const SERVICE_ALIASES: Array<{ aliases: string[]; name: string }> = [
  { aliases: ['hair spa', 'hairspa'], name: 'Hair Spa' },
  { aliases: ['hair cut', 'haircut', 'hair-cut'], name: 'Haircut' },
  { aliases: ['beard', 'beard trim'], name: 'Beard Trim' },
  { aliases: ['shaving', 'shave'], name: 'Shaving' },
  { aliases: ['facial'], name: 'Facial' },
  { aliases: ['spa'], name: 'Spa' },
];

export interface AssistantProposal {
  businessId: string;
  businessName: string;
  slug: string;
  serviceId: string;
  serviceName: string;
  staffId?: string;
  staffName?: string;
  date: string;
  startTime: string;
  spokenTime: string;
}

export interface AssistantResult {
  reply: string;
  speak: boolean;
  needsConsent: boolean;
  proposal?: AssistantProposal;
  alternatives?: string[];
  businesses?: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    location: string | null;
    distanceKm?: number;
  }>;
  booked?: { id: string };
}

export function parseCustomerIntent(text: string) {
  const lower = text.toLowerCase();
  let serviceName: string | undefined;
  for (const svc of SERVICE_ALIASES) {
    if (svc.aliases.some((a) => lower.includes(a))) {
      serviceName = svc.name;
      break;
    }
  }

  const inMatch = lower.match(/\b(?:in|at|for)\s+([a-z0-9][a-z0-9&' ]{1,40}?)(?:\s+at\s+|\s+today|\s+tomorrow|\s+on\s+|$)/i);
  let businessHint = inMatch?.[1]?.trim();
  businessHint = businessHint
    ?.replace(/\b(today|tomorrow|tonight|morning|evening|afternoon)\b/gi, '')
    .replace(/\s+at\s+\d.*/i, '')
    .trim();

  const cityMatch = lower.match(
    /\b(bangalore|bengaluru|mumbai|delhi|hyderabad|chennai|pune|kolkata|kochi|jaipur)\b/
  );

  let dateOffset = 0;
  if (/\btoday\b/.test(lower)) dateOffset = 0;
  else if (/\btomorrow\b/.test(lower)) dateOffset = 1;
  else if (/\bday after\b/.test(lower)) dateOffset = 2;

  const timeMatch = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  let startTime: string | undefined;
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10);
    const m = timeMatch[2] || '00';
    const mer = timeMatch[3];
    if (mer === 'pm' && h < 12) h += 12;
    if (mer === 'am' && h === 12) h = 0;
    if (!mer && h < 8) h += 12;
    startTime = `${h.toString().padStart(2, '0')}:${m}`;
  }

  const confirm = /^(yes|yeah|yep|ok|okay|book it|confirm|please book|go ahead|sure)\b/i.test(text.trim());
  const deny = /^(no|nope|cancel|not now|don't|dont)\b/i.test(text.trim());

  return { serviceName, businessHint, city: cityMatch?.[1], dateOffset, startTime, confirm, deny };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function discoverBusinesses(opts: {
  city?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
}) {
  const cityFilter = opts.city && !/^near me$/i.test(opts.city) ? opts.city : undefined;
  const businesses = await prisma.business.findMany({
    where: {
      isActive: true,
      ...(opts.category ? { category: opts.category } : {}),
      ...(cityFilter
        ? { location: { contains: cityFilter, mode: 'insensitive' } }
        : {}),
    },
    include: { services: { where: { isActive: true }, take: 4 } },
    orderBy: { name: 'asc' },
    take: 40,
  });

  let list = businesses.map((b) => {
    let distanceKm: number | undefined;
    if (
      opts.latitude != null &&
      opts.longitude != null &&
      b.latitude != null &&
      b.longitude != null
    ) {
      distanceKm = Math.round(haversineKm(opts.latitude, opts.longitude, b.latitude, b.longitude) * 10) / 10;
    }
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      category: b.category,
      location: b.location,
      latitude: b.latitude,
      longitude: b.longitude,
      services: b.services.map((s) => ({ id: s.id, name: s.name, price: s.price, duration: s.duration })),
      distanceKm,
    };
  });

  if (opts.latitude != null && opts.longitude != null) {
    list = list.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  }

  return list;
}

async function dayStatus(businessId: string, date: Date, serviceId: string, staffId?: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { businessHours: true, holidays: true },
  });
  if (!business) return { closed: true, reason: 'Business not found', slots: [] as string[] };

  const holiday = business.holidays.find((h) => isSameDay(h.date, date));
  if (holiday) {
    return { closed: true, reason: `${format(date, 'EEEE')} is a holiday${holiday.label ? ` (${holiday.label})` : ''}.`, slots: [] };
  }

  const hour = business.businessHours.find((h) => h.day === getDay(date));
  if (!hour || hour.isClosed) {
    const dayName = DAYS[getDay(date)];
    return { closed: true, reason: `${dayName} is a holiday / closed for this business.`, slots: [] };
  }

  const slots = await getAvailableSlots({ businessId, serviceId, staffId, date });
  return { closed: false, reason: slots.length ? '' : 'fully booked', slots };
}

function nextOpenDayMessage(
  checks: Array<{ date: Date; closed: boolean; reason: string; slots: string[] }>
) {
  const closedDays = checks.filter((c) => c.closed);
  const open = checks.find((c) => !c.closed && c.slots.length > 0);

  const parts: string[] = [];
  if (checks[0] && !checks[0].closed && checks[0].slots.length === 0) {
    parts.push('Today is fully booked.');
  }
  if (checks[1]?.closed) {
    parts.push(`Tomorrow is ${format(checks[1].date, 'EEEE')}, and the business is closed.`);
  } else if (checks[1] && !checks[1].closed && checks[1].slots.length === 0) {
    parts.push('Tomorrow is also fully booked.');
  }

  const nextThreeFull = checks.slice(0, 3).every((c) => c.closed || c.slots.length === 0);
  if (nextThreeFull) {
    parts.push('The next 3 days are fully occupied or closed.');
  }

  if (open) {
    const label = isToday(open.date) ? 'today' : isTomorrow(open.date) ? 'tomorrow' : format(open.date, 'EEEE, MMM d');
    parts.push(`${label} has openings such as ${open.slots.slice(0, 3).map(formatTime12h).join(', ')}.`);
  }

  closedDays.slice(0, 2).forEach((c) => {
    if (!parts.join(' ').includes(c.reason)) parts.push(c.reason);
  });

  return parts.join(' ');
}

export async function handleCustomerAssistant(opts: {
  message: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  proposal?: AssistantProposal | null;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  confirmBooking?: boolean;
}): Promise<AssistantResult> {
  const intent = parseCustomerIntent(opts.message);

  if (opts.confirmBooking || intent.confirm) {
    const proposal = opts.proposal;
    if (!proposal) {
      return {
        reply: 'I do not have a slot waiting. Tell me what you want to book, for example a haircut today at 4 PM.',
        speak: true,
        needsConsent: false,
      };
    }
    const { notifyNewBookingRequest } = await import('./notifications');
    const { isSlotAvailable, calculateEndTime } = await import('./availability');
    const available = await isSlotAvailable({
      businessId: proposal.businessId,
      serviceId: proposal.serviceId,
      staffId: proposal.staffId,
      date: new Date(proposal.date),
      startTime: proposal.startTime,
    });
    if (!available) {
      return {
        reply: 'That slot was just taken. Please pick another time.',
        speak: true,
        needsConsent: false,
      };
    }
    const endTime = await calculateEndTime(proposal.serviceId, proposal.startTime, proposal.businessId);
    const booking = await prisma.booking.create({
      data: {
        businessId: proposal.businessId,
        serviceId: proposal.serviceId,
        staffId: proposal.staffId || null,
        customerId: opts.customerId,
        customerName: opts.customerName,
        customerPhone: opts.customerPhone,
        date: new Date(proposal.date),
        startTime: proposal.startTime,
        endTime,
        status: 'PENDING',
      },
    });
    await notifyNewBookingRequest(booking.id);
    return {
      reply: `Booking request sent for ${proposal.serviceName} at ${proposal.businessName} on ${format(new Date(proposal.date), 'EEE, MMM d')} at ${proposal.spokenTime}. No payment is taken now. Waiting for the business to confirm.`,
      speak: true,
      needsConsent: false,
      booked: { id: booking.id },
    };
  }

  if (intent.deny && opts.proposal) {
    return {
      reply: 'Okay, I will not book that slot. Tell me another time or business.',
      speak: true,
      needsConsent: false,
    };
  }

  const city = opts.city && !/^near me$/i.test(opts.city) ? opts.city : intent.city;
  let businesses = await prisma.business.findMany({
    where: {
      isActive: true,
      ...(city ? { location: { contains: city === 'bangalore' || city === 'bengaluru' ? 'bangalore' : city, mode: 'insensitive' } } : {}),
    },
    include: {
      services: { where: { isActive: true } },
      staff: { where: { isActive: true }, include: { staffServices: true } },
    },
  });

  if (city && (city.toLowerCase() === 'bangalore' || city.toLowerCase() === 'bengaluru')) {
    const extra = await prisma.business.findMany({
      where: { isActive: true, location: { contains: 'bengaluru', mode: 'insensitive' } },
      include: {
        services: { where: { isActive: true } },
        staff: { where: { isActive: true }, include: { staffServices: true } },
      },
    });
    const ids = new Set(businesses.map((b) => b.id));
    extra.forEach((b) => {
      if (!ids.has(b.id)) businesses.push(b);
    });
  }

  if (opts.latitude != null && opts.longitude != null) {
    businesses = businesses
      .map((b) => ({
        b,
        d:
          b.latitude != null && b.longitude != null
            ? haversineKm(opts.latitude!, opts.longitude!, b.latitude, b.longitude)
            : 9999,
      }))
      .sort((a, c) => a.d - c.d)
      .map((x) => x.b);
  }

  if (intent.businessHint) {
    const hint = intent.businessHint.toLowerCase();
    const matched = businesses.filter(
      (b) => b.name.toLowerCase().includes(hint) || hint.includes(b.name.toLowerCase()) || b.slug.includes(hint.replace(/\s+/g, ''))
    );
    if (matched.length) businesses = matched;
  }

  if (!businesses.length) {
    return {
      reply: city
        ? `I could not find booking businesses in ${city} yet. Try another area or explore categories.`
        : 'I could not find a matching business. Set your location, like Bangalore, or name the shop.',
      speak: true,
      needsConsent: false,
    };
  }

  if (!intent.serviceName && !intent.businessHint) {
    const names = businesses.slice(0, 5).map((b) => b.name).join(', ');
    return {
      reply: `Here are available businesses${city ? ` in ${city}` : ''}: ${names}. Tell me the service and time, for example haircut today at 4 PM.`,
      speak: true,
      needsConsent: false,
      businesses: businesses.slice(0, 8).map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        category: b.category,
        location: b.location,
      })),
    };
  }

  const business = businesses[0];
  const service =
    business.services.find((s) =>
      intent.serviceName ? s.name.toLowerCase().includes(intent.serviceName.toLowerCase()) : true
    ) || business.services[0];

  if (!service) {
    return {
      reply: `${business.name} has no services listed yet.`,
      speak: true,
      needsConsent: false,
    };
  }

  const staff = business.staff.find((st) =>
    st.staffServices.some((ss) => ss.serviceId === service.id)
  ) || business.staff[0];

  const targetDate = addDays(new Date(), intent.dateOffset || 0);
  targetDate.setHours(0, 0, 0, 0);

  const requested = await dayStatus(business.id, targetDate, service.id, staff?.id);
  if (requested.closed || requested.slots.length === 0) {
    const availability = nextOpenDayMessage(
      await Promise.all(
        [0, 1, 2, 3].map(async (i) => {
          const d = addDays(new Date(), i);
          d.setHours(0, 0, 0, 0);
          return { date: d, ...(await dayStatus(business.id, d, service.id, staff?.id)) };
        })
      )
    );
    return {
      reply: `${requested.closed ? requested.reason : `No slots left at ${business.name} for ${isToday(targetDate) ? 'today' : format(targetDate, 'EEEE')}.`} ${availability}`.trim(),
      speak: true,
      needsConsent: false,
      alternatives: requested.slots,
    };
  }

  let slot = intent.startTime && requested.slots.includes(intent.startTime) ? intent.startTime : undefined;
  if (intent.startTime && !slot) {
    const nearest = requested.slots[0];
    const spoken = formatTime12h(nearest);
    return {
      reply: `${formatTime12h(intent.startTime)} is not available at ${business.name}. ${isToday(targetDate) && requested.slots.length === 0 ? 'Today is full. ' : ''}Available times include ${requested.slots.slice(0, 4).map(formatTime12h).join(', ')}. Would you like ${spoken} instead?`,
      speak: true,
      needsConsent: true,
      proposal: {
        businessId: business.id,
        businessName: business.name,
        slug: business.slug,
        serviceId: service.id,
        serviceName: service.name,
        staffId: staff?.id,
        staffName: staff?.name,
        date: targetDate.toISOString(),
        startTime: nearest,
        spokenTime: spoken,
      },
      alternatives: requested.slots.slice(0, 6).map(formatTime12h),
    };
  }

  slot = slot || requested.slots[0];
  const spokenTime = formatTime12h(slot);
  const when = isToday(targetDate) ? 'today' : isTomorrow(targetDate) ? 'tomorrow' : format(targetDate, 'EEEE');

  return {
    reply: `I found ${service.name} at ${business.name}${business.location ? ` in ${business.location}` : ''}. ${when} at ${spokenTime} is available with ${staff?.name || 'the team'}. No payment is taken now. Are you okay to book the ${spokenTime} slot?`,
    speak: true,
    needsConsent: true,
    proposal: {
      businessId: business.id,
      businessName: business.name,
      slug: business.slug,
      serviceId: service.id,
      serviceName: service.name,
      staffId: staff?.id,
      staffName: staff?.name,
      date: targetDate.toISOString(),
      startTime: slot,
      spokenTime,
    },
    alternatives: requested.slots.slice(0, 6).map(formatTime12h),
  };
}
