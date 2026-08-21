import { inferCategory } from './booking-schema';
import { slugify } from './utils';

export type OnboardingStep =
  | 'welcome'
  | 'collecting'
  | 'confirm'
  | 'complete';

export interface ServiceDraft {
  name: string;
  price?: number;
  duration?: number;
}

export interface StaffDraft {
  name: string;
  services?: string[];
}

export interface OnboardingState {
  step: OnboardingStep;
  businessName?: string;
  category?: string;
  location?: string;
  description?: string;
  services?: ServiceDraft[];
  staff?: StaffDraft[];
  workingHours?: Record<number, { open: string; close: string }>;
  breaks?: Array<{ start: string; end: string; label?: string }>;
  holidays?: string[];
  advanceBookingDays?: number;
  cancellationHours?: number;
  bufferMinutes?: number;
  staffSkipped?: boolean;
  hoursSetByUser?: boolean;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const DEFAULT_HOURS = { open: '10:00', close: '21:00' };

const SERVICE_KEYWORDS: Array<{ aliases: string[]; name: string; duration: number }> = [
  { aliases: ['hair spa', 'hairspa'], name: 'Hair Spa', duration: 60 },
  { aliases: ['hair cut', 'haircut', 'hair-cut'], name: 'Haircut', duration: 30 },
  { aliases: ['beard trim', 'beard'], name: 'Beard Trim', duration: 15 },
  { aliases: ['shaving', 'shave'], name: 'Shaving', duration: 20 },
  { aliases: ['hair colour', 'hair color', 'colouring', 'coloring'], name: 'Hair Color', duration: 60 },
  { aliases: ['hair wash', 'wash'], name: 'Hair Wash', duration: 20 },
  { aliases: ['manicure'], name: 'Manicure', duration: 30 },
  { aliases: ['pedicure'], name: 'Pedicure', duration: 40 },
  { aliases: ['facial'], name: 'Facial', duration: 45 },
  { aliases: ['massage'], name: 'Massage', duration: 45 },
  { aliases: ['spa'], name: 'Spa', duration: 45 },
  { aliases: ['consultation'], name: 'Consultation', duration: 20 },
];

const SKIP_WORDS = /^(none|no|skip|n\/a|na|not now|nothing|no one|just me|myself|i work alone|solo)$/i;

const STOP_NAME_WORDS = new Set([
  'create', 'appointment', 'booking', 'system', 'business', 'salon', 'saloon', 'shop',
  'studio', 'clinic', 'spa', 'for', 'my', 'the', 'a', 'an', 'and', 'with', 'please',
  'change', 'fares', 'fare', 'price', 'prices', 'staff', 'service', 'services',
  'hair', 'cut', 'shaving', 'open', 'hours', 'break', 'lunch', 'yes', 'no',
  'confirm', 'green', 'trends', 'named', 'called',
]);

export function createInitialState(): OnboardingState {
  return {
    step: 'welcome',
    messages: [],
    workingHours: Object.fromEntries(
      [1, 2, 3, 4, 5, 6].map((d) => [d, { ...DEFAULT_HOURS }])
    ),
    breaks: [],
    holidays: [],
    advanceBookingDays: 30,
    cancellationHours: 2,
    bufferMinutes: 0,
  };
}

export function processOnboardingMessage(
  state: OnboardingState,
  userMessage: string
): { state: OnboardingState; response: string } {
  const msg = userMessage.trim();
  let newState: OnboardingState = {
    ...state,
    messages: [...state.messages, { role: 'user', content: msg }],
  };

  if (newState.step === 'complete') {
    return { state: newState, response: 'Your booking system is already ready.' };
  }

  const extracted = extractEntities(msg, newState);
  newState = mergeExtracted(newState, extracted);

  if (newState.step === 'welcome') {
    newState.step = 'collecting';
  }

  if (newState.step === 'confirm' || isFullyCollected(newState)) {
    if (isAffirmative(msg) && !isChangeRequest(msg)) {
      newState.step = 'complete';
      return { state: newState, response: '✅ Your booking system is ready!' };
    }

    if (isChangeRequest(msg) || newState.step === 'confirm') {
      if (extractedHasUsefulData(extracted)) {
        newState.step = 'confirm';
        return {
          state: newState,
          response: `Updated. Here's what I have now:\n\n${buildFinalSummary(newState)}\n\nShall I create your booking system? Reply Yes, or tell me what to change.`,
        };
      }
      if (newState.step === 'confirm' && !isAffirmative(msg)) {
        return {
          state: newState,
          response: `I didn't catch a specific change. You can say things like:\n• "Change prices: Haircut 200, Shaving 100"\n• "Staff are Ravi and Ajay"\n• "Hours 10 to 8"\n\nCurrent setup:\n\n${buildFinalSummary(newState)}\n\nReply Yes to create, or describe the change.`,
        };
      }
    }

    if (isFullyCollected(newState)) {
      newState.step = 'confirm';
      return {
        state: newState,
        response: `${buildFinalSummary(newState)}\n\nShall I create your booking system? Reply Yes to confirm, or tell me what to change.`,
      };
    }
  }

  const nextQuestion = getNextMissingQuestion(newState);
  return { state: newState, response: nextQuestion };
}

interface Extracted {
  businessName?: string;
  category?: string;
  services?: ServiceDraft[];
  staff?: StaffDraft[];
  workingHours?: Record<number, { open: string; close: string }>;
  breaks?: Array<{ start: string; end: string; label?: string }>;
  skipStaff?: boolean;
  skipBreaks?: boolean;
  skipHolidays?: boolean;
}

function extractEntities(text: string, state: OnboardingState): Extracted {
  const extracted: Extracted = {};
  const lower = text.toLowerCase();

  const name = extractBusinessName(text);
  if (name) extracted.businessName = name;

  const inferred = inferCategory(`${text} ${state.businessName || ''}`);
  if (/salon|saloon|beauty|parlour|parlor|spa|barber|hair/i.test(text)) {
    extracted.category = 'beauty';
  } else if (inferred && inferred !== 'beauty') {
    extracted.category = inferred;
  } else if (/salon|saloon|beauty/.test(lower)) {
    extracted.category = 'beauty';
  }

  const pricedServices = extractPricedServices(text);
  const listedServices = extractListedServices(text, state);
  if (pricedServices.length) {
    extracted.services = pricedServices;
  } else if (listedServices.length) {
    extracted.services = listedServices;
  }

  const staff = extractStaff(text, extracted.services || state.services || []);
  if (staff.length) extracted.staff = staff;

  const missingStaff = !(state.staff?.length || state.staffSkipped || extracted.staff?.length);
  const pricesReady = (extracted.services || state.services || []).every((s) => s.price);
  const hasServices = (extracted.services || state.services || []).length > 0;

  if (
    missingStaff &&
    hasServices &&
    pricesReady &&
    (SKIP_WORDS.test(text) || /just me|myself|i work alone|solo|only me/i.test(text))
  ) {
    extracted.skipStaff = true;
  }

  if (!extracted.staff?.length && missingStaff && hasServices && pricesReady && !extracted.services?.some((s) => s.price)) {
    const maybeServices = extractListedServices(text, { ...state, services: [] });
    if (maybeServices.length && !/\bstaff\b|\bteam\b/i.test(text)) {
      extracted.services = maybeServices;
    }
  }

  const hours = parseWorkingHours(text);
  if (hours.hours) extracted.workingHours = hours.hours;
  if (hours.breaks.length) extracted.breaks = hours.breaks;

  if ((state.staff?.length || extracted.skipStaff || extracted.staff?.length) && !state.hoursSetByUser) {
    if (/^default\b/i.test(text) || SKIP_WORDS.test(text)) {
      extracted.workingHours = extracted.workingHours || state.workingHours;
    }
  }

  return extracted;
}

function mergeExtracted(state: OnboardingState, extracted: Extracted): OnboardingState {
  const next: OnboardingState = { ...state };

  if (extracted.businessName) next.businessName = titleCase(extracted.businessName);
  if (extracted.category) next.category = extracted.category;
  if (!next.category && next.businessName) next.category = inferCategory(next.businessName);

  if (extracted.services?.length) {
    next.services = mergeServices(next.services || [], extracted.services);
  }

  if (extracted.skipStaff) {
    next.staffSkipped = true;
    if (!next.staff?.length) {
      next.staff = [{ name: next.businessName || 'Owner', services: next.services?.map((s) => s.name) }];
    }
  }
  if (extracted.staff?.length) {
    next.staff = extracted.staff;
    next.staffSkipped = false;
  }

  if (extracted.workingHours) {
    next.workingHours = extracted.workingHours;
    next.hoursSetByUser = true;
  }
  if (extracted.breaks?.length) next.breaks = extracted.breaks;

  return next;
}

function mergeServices(existing: ServiceDraft[], incoming: ServiceDraft[]): ServiceDraft[] {
  const byKey = new Map<string, ServiceDraft>();
  for (const s of existing) byKey.set(normalizeServiceKey(s.name), { ...s });
  for (const s of incoming) {
    const key = normalizeServiceKey(s.name);
    const prev = byKey.get(key);
    if (prev) {
      byKey.set(key, {
        name: canonicalServiceName(s.name) || prev.name,
        price: s.price ?? prev.price,
        duration: s.duration ?? prev.duration,
      });
    } else {
      byKey.set(key, {
        name: canonicalServiceName(s.name) || s.name,
        price: s.price,
        duration: s.duration,
      });
    }
  }
  return Array.from(byKey.values());
}

function extractedHasUsefulData(extracted: Extracted): boolean {
  return Boolean(
    extracted.businessName ||
    extracted.category ||
    extracted.services?.length ||
    extracted.staff?.length ||
    extracted.workingHours ||
    extracted.breaks?.length ||
    extracted.skipStaff
  );
}

function isFullyCollected(state: OnboardingState): boolean {
  const hasName = Boolean(state.businessName);
  const hasServices = (state.services || []).length > 0;
  const pricesReady = (state.services || []).every((s) => typeof s.price === 'number' && s.price > 0);
  const hasStaff = (state.staff || []).length > 0 || Boolean(state.staffSkipped);
  return hasName && hasServices && pricesReady && hasStaff && Boolean(state.hoursSetByUser);
}

function getNextMissingQuestion(state: OnboardingState): string {
  if (!state.businessName) {
    return "Great, let's set up your booking system. What is your business name?";
  }
  if (!state.category) {
    return `Nice, ${state.businessName}. What type of business is it? (Salon, Clinic, Car Service, Tutoring, Sports Court, etc.)`;
  }
  if (!state.services?.length) {
    return `Got it — ${state.businessName} (${getCategoryLabel(state.category)}).\n\nWhat services do you offer? For example: Haircut, Shaving, Hair Spa`;
  }
  const missingPrices = state.services.filter((s) => !s.price);
  if (missingPrices.length) {
    const example = missingPrices
      .slice(0, 2)
      .map((s, i) => `${s.name} ${[200, 100][i] || 300}`)
      .join(', ');
    return `Services noted: ${state.services.map((s) => s.name).join(', ')}.\n\nWhat are the prices? Example: "${example}"`;
  }
  if (!state.staff?.length && !state.staffSkipped) {
    return `Prices saved.\n${state.services.map((s) => `• ${s.name} — ₹${s.price}`).join('\n')}\n\nWho is on your team? Share staff names, or say "just me" if you work alone.`;
  }
  if (!state.hoursSetByUser) {
    return 'What are your working hours? Example: "10 AM to 9 PM, closed Sunday". Say "default" for 10 AM–9 PM.';
  }
  return `${buildFinalSummary(state)}\n\nShall I create your booking system? Reply Yes to confirm, or tell me what to change.`;
}

function extractBusinessName(text: string): string | undefined {
  const quoted = text.match(/['"]([^'"]{2,80})['"]/);
  if (quoted) return cleanBusinessName(quoted[1]);

  const forMy = text.match(
    /(?:for my|called|named)\s+['"]?([^,'"\n]+?)['"]?(?=\s+(?:salon|saloon|clinic|shop|studio|spa|parlour|parlor|business|gym|garage)\b|[.,]|$)/i
  );
  if (forMy) return cleanBusinessName(forMy[1]);

  const myBiz = text.match(/\bmy\s+([A-Z][A-Za-z0-9&' ]{1,40})\s+(?:salon|saloon|clinic|shop|studio)\b/);
  if (myBiz) return cleanBusinessName(myBiz[1]);

  return undefined;
}

function cleanBusinessName(name: string): string {
  return name
    .replace(/\b(salon|saloon|clinic|shop|studio|spa|business)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPricedServices(text: string): ServiceDraft[] {
  const results: ServiceDraft[] = [];
  const pattern =
    /([A-Za-z][A-Za-z\s]{1,40}?)\s*[-–:]\s*(?:₹|rs\.?|inr)?\s*(\d{2,6})(?:\s*(?:rs|inr|rupees)?)?/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const rawName = match[1].replace(/^(and|the|for|fares?|prices?|change|please)\s+/i, '').trim();
    if (!rawName || /^(fares?|prices?|change|please|staff|hours)$/i.test(rawName)) continue;
    const known = findKnownServices(rawName);
    const name = known[0] || canonicalServiceName(rawName) || titleCase(rawName.replace(/^[^\w]+|[^\w]+$/g, ''));
    results.push({
      name,
      price: parseInt(match[2], 10),
      duration: defaultDuration(name),
    });
  }

  const inline = /([A-Za-z][A-Za-z\s]{1,30}?)\s*(?:₹|rs\.?)\s*(\d{2,6})/gi;
  while ((match = inline.exec(text)) !== null) {
    const rawName = match[1].trim();
    const name = canonicalServiceName(rawName) || titleCase(rawName);
    if (!results.some((s) => normalizeServiceKey(s.name) === normalizeServiceKey(name))) {
      results.push({ name, price: parseInt(match[2], 10), duration: defaultDuration(name) });
    }
  }

  return results;
}

function extractListedServices(text: string, state: OnboardingState): ServiceDraft[] {
  const known = findKnownServices(text);
  if (known.length) {
    return known.map((name) => ({
      name,
      duration: defaultDuration(name),
    }));
  }

  const looksLikeList = /,|;|\band\b/i.test(text);
  const askingServices = !state.services?.length;
  if (!looksLikeList || !askingServices) return [];
  if (/\bstaff\b|\bteam\b|\bemployee/i.test(text)) return [];

  return text
    .split(/,|;|\band\b/i)
    .map((part) => part.replace(/['"]/g, '').trim())
    .filter((part) => part.length > 1 && part.length < 40)
    .filter((part) => !/create|booking|system|please|change|fare|price|hour|open/i.test(part))
    .map((part) => ({
      name: canonicalServiceName(part) || titleCase(part),
      duration: defaultDuration(part),
    }));
}

function findKnownServices(text: string): string[] {
  const lower = text.toLowerCase();
  const found: Array<{ name: string; index: number }> = [];
  for (const svc of SERVICE_KEYWORDS) {
    const aliases = [...svc.aliases].sort((a, b) => b.length - a.length);
    for (const alias of aliases) {
      const re = new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`, 'i');
      const match = re.exec(lower);
      if (match && !found.some((f) => f.name === svc.name)) {
        found.push({ name: svc.name, index: match.index });
        break;
      }
    }
  }
  let names = found.sort((a, b) => a.index - b.index).map((f) => f.name);
  if (names.includes('Hair Spa')) {
    const withoutHairSpa = lower.replace(/hair\s*spa/g, '');
    if (!/\bspa\b/.test(withoutHairSpa)) {
      names = names.filter((n) => n !== 'Spa');
    }
  }
  return names;
}

function extractStaff(text: string, services: ServiceDraft[]): StaffDraft[] {
  const hasStaffCue = /\bstaff\b|\bteam\b|\bemployee|\bstylist|\bbarber|\bdoctor|\bmy staff\b/i.test(text);
  const hasKnownPerson = /\b(ravi|ajay|kumar|rahul|amit|priya|neha|anjali|suresh|ramesh)\b/i.test(text);
  if (!hasStaffCue && !hasKnownPerson) return [];

  const explicit = text.match(
    /(?:staff|team|employees?|stylists?|barbers?)\s*(?:are|is|:)?\s*([A-Za-z,\s&]+)/i
  );
  const chunk = explicit?.[1] || text;
  const names = chunk
    .split(/,|;|\band\b|&/i)
    .map((n) => n.replace(/[:.]/g, '').trim())
    .filter(Boolean)
    .filter((n) => n.split(/\s+/).length <= 3)
    .filter((n) => !isServiceName(n, services))
    .filter((n) => !STOP_NAME_WORDS.has(n.toLowerCase()))
    .filter((n) => !/^\d+$/.test(n))
    .filter((n) => !/create|booking|system|hours|open|price|fare/i.test(n))
    .map((n) => titleCase(n));

  const unique = Array.from(new Set(names));
  return unique.map((name) => ({
    name,
    services: services.map((s) => s.name),
  }));
}

function isServiceName(value: string, services: ServiceDraft[]): boolean {
  const key = normalizeServiceKey(value);
  if (services.some((s) => normalizeServiceKey(s.name) === key)) return true;
  return SERVICE_KEYWORDS.some(
    (svc) => normalizeServiceKey(svc.name) === key || svc.aliases.includes(key)
  );
}

function canonicalServiceName(raw: string): string | undefined {
  const key = normalizeServiceKey(raw);
  const found = SERVICE_KEYWORDS.find(
    (svc) => normalizeServiceKey(svc.name) === key || svc.aliases.includes(key)
  );
  return found?.name;
}

function defaultDuration(name: string): number {
  const key = normalizeServiceKey(name);
  return SERVICE_KEYWORDS.find(
    (svc) => normalizeServiceKey(svc.name) === key || svc.aliases.includes(key)
  )?.duration || 30;
}

function normalizeServiceKey(name: string): string {
  return name.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function isAffirmative(msg: string): boolean {
  return /^(yes|y|yeah|yep|ok|okay|confirm|create|go ahead|looks good|correct|sure|do it)\b/i.test(
    msg.trim()
  );
}

function isChangeRequest(msg: string): boolean {
  return /\b(change|edit|update|wrong|instead|actually|fares?|prices?|rename|fix|correct the)\b/i.test(msg);
}

export function buildFinalSummary(state: OnboardingState): string {
  const services = state.services?.length
    ? state.services
        .map((s) => `${s.name}${s.price ? ` (₹${s.price}, ${s.duration || 30} min)` : ''}`)
        .join(', ')
    : 'Not set';
  const staff = state.staff?.length ? state.staff.map((s) => s.name).join(', ') : 'Owner';
  const hours = state.workingHours?.[1]
    ? `${formatTime12(state.workingHours[1].open)}–${formatTime12(state.workingHours[1].close)}`
    : '10:00 AM–9:00 PM';

  const lines = [
    `📋 ${state.businessName || 'Your business'}`,
    `Category: ${getCategoryLabel(state.category || 'beauty')}`,
    `Services: ${services}`,
    `Staff: ${staff}`,
    `Hours: Mon–Sat ${hours}`,
  ];
  if (state.breaks?.length) {
    lines.push(
      `Breaks: ${state.breaks.map((b) => `${formatTime12(b.start)}–${formatTime12(b.end)}`).join(', ')}`
    );
  }
  return lines.join('\n');
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    beauty: 'Beauty / Salon',
    health: 'Health / Clinic',
    auto: 'Auto Service',
    education: 'Education / Tutoring',
    sports: 'Sports',
    fitness: 'Fitness',
    home: 'Home Services',
    professional: 'Professional Services',
  };
  return labels[category] || category;
}

function parseWorkingHours(text: string) {
  const hours: Record<number, { open: string; close: string }> = {};
  const openMatch = text.match(
    /(?:open(?:ing)?(?: hours?)?|from|we(?:'re| are)? open)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-|–)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
  );
  if (openMatch) {
    const open = to24h(parseInt(openMatch[1], 10), openMatch[2], openMatch[3]);
    const close = to24h(parseInt(openMatch[4], 10), openMatch[5], openMatch[6] || 'pm');
    for (let d = 0; d <= 6; d++) hours[d] = { open, close };
    if (/sunday|sun/i.test(text) && /closed/i.test(text)) {
      hours[0] = { open: '00:00', close: '00:00' };
    }
    if (/mon.*sat/i.test(text) || /closed sunday/i.test(text)) {
      hours[0] = { open: '00:00', close: '00:00' };
    }
  }
  return { hours: Object.keys(hours).length ? hours : undefined, breaks: parseBreaks(text) };
}

function parseBreaks(text: string): Array<{ start: string; end: string; label?: string }> {
  const breaks: Array<{ start: string; end: string; label?: string }> = [];
  const pattern =
    /(?:(lunch|break)\s*(?:from|is)?\s*)(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-|–)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    breaks.push({
      start: to24h(parseInt(match[2], 10), match[3], match[4]),
      end: to24h(parseInt(match[5], 10), match[6], match[7] || match[4]),
      label: match[1] ? titleCase(match[1]) : 'Break',
    });
  }
  return breaks;
}

function to24h(hour: number, min?: string, meridiem?: string): string {
  let h = hour;
  const mer = (meridiem || '').toLowerCase();
  if (mer === 'pm' && h < 12) h += 12;
  if (mer === 'am' && h === 12) h = 0;
  if (!mer && h > 0 && h < 8) h += 12;
  return `${h.toString().padStart(2, '0')}:${(min || '00').padStart(2, '0')}`;
}

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

export async function createBusinessFromOnboarding(userId: string, state: OnboardingState) {
  const { prisma } = await import('./db');
  const { getBookingSchema } = await import('./booking-schema');

  let slug = slugify(state.businessName || 'business');
  const existing = await prisma.business.findUnique({ where: { slug } });
  if (existing) slug = `${slug}${Date.now().toString(36)}`;

  const category = state.category || 'beauty';
  const schema = getBookingSchema(category);

  const business = await prisma.business.create({
    data: {
      ownerId: userId,
      name: state.businessName || 'My Business',
      slug,
      category,
      location: state.location,
      description: state.description,
      bookingSchema: JSON.stringify(schema),
      advanceBookingDays: state.advanceBookingDays || 30,
      cancellationHours: state.cancellationHours || 2,
      bufferMinutes: state.bufferMinutes || 0,
    },
  });

  const serviceRecords = await Promise.all(
    (state.services || []).map((s, i) =>
      prisma.service.create({
        data: {
          businessId: business.id,
          name: s.name,
          price: s.price || 300,
          duration: s.duration || 30,
          sortOrder: i,
        },
      })
    )
  );

  const staffSource = state.staff?.length
    ? state.staff
    : [{ name: state.businessName || 'Owner', services: serviceRecords.map((s) => s.name) }];

  const staffRecords = await Promise.all(
    staffSource.map((s) =>
      prisma.staff.create({
        data: { businessId: business.id, name: s.name, role: 'Staff' },
      })
    )
  );

  for (const staffMember of staffSource) {
    const staffRecord = staffRecords.find((s) => s.name === staffMember.name);
    if (!staffRecord) continue;
    const assignedServices = staffMember.services?.length
      ? staffMember.services
      : serviceRecords.map((s) => s.name);
    for (const svcName of assignedServices) {
      const svc = serviceRecords.find((s) => s.name.toLowerCase() === svcName.toLowerCase());
      if (svc) {
        await prisma.staffService.create({
          data: { staffId: staffRecord.id, serviceId: svc.id },
        });
      }
    }
  }

  const hours = state.workingHours || {};
  for (const [day, times] of Object.entries(hours)) {
    const isClosed = times.open === '00:00' && times.close === '00:00';
    await prisma.businessHour.create({
      data: {
        businessId: business.id,
        day: parseInt(day, 10),
        openingTime: times.open,
        closingTime: times.close,
        isClosed,
      },
    });
    for (const staffRecord of staffRecords) {
      await prisma.staffHour.create({
        data: {
          staffId: staffRecord.id,
          day: parseInt(day, 10),
          openingTime: times.open,
          closingTime: times.close,
          isClosed,
        },
      });
    }
  }

  for (const brk of state.breaks || []) {
    await prisma.break.create({
      data: {
        businessId: business.id,
        startTime: brk.start,
        endTime: brk.end,
        label: brk.label,
      },
    });
  }

  return business;
}
