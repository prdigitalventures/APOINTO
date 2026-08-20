import { inferCategory } from './booking-schema';
import { slugify } from './utils';

export type OnboardingStep =
  | 'welcome'
  | 'business_name'
  | 'business_category'
  | 'services'
  | 'service_prices'
  | 'service_durations'
  | 'staff'
  | 'staff_services'
  | 'working_hours'
  | 'breaks'
  | 'holidays'
  | 'booking_rules'
  | 'confirm'
  | 'complete';

export interface OnboardingState {
  step: OnboardingStep;
  businessName?: string;
  category?: string;
  location?: string;
  description?: string;
  services?: Array<{ name: string; price?: number; duration?: number }>;
  staff?: Array<{ name: string; services?: string[] }>;
  workingHours?: Record<number, { open: string; close: string }>;
  breaks?: Array<{ start: string; end: string; label?: string }>;
  holidays?: string[];
  advanceBookingDays?: number;
  cancellationHours?: number;
  bufferMinutes?: number;
  pendingConfirmation?: {
    summary: string;
    field: string;
    parsed: Record<string, unknown>;
  };
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const DEFAULT_HOURS = { open: '10:00', close: '21:00' };

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
  const newMessages = [...state.messages, { role: 'user' as const, content: msg }];
  let newState: OnboardingState = { ...state, messages: newMessages };

  if (state.pendingConfirmation) {
    if (/^(yes|confirm|correct|ok|yep|yeah|looks good)/i.test(msg)) {
      newState = applyConfirmedData(newState, state.pendingConfirmation);
      newState.pendingConfirmation = undefined;
    } else if (/^(no|edit|change|wrong)/i.test(msg)) {
      newState.pendingConfirmation = undefined;
      return {
        state: newState,
        response: getStepQuestion(newState),
      };
    }
  }

  if (/create.*booking|setup.*business|start.*business|new business/i.test(msg) && state.step === 'welcome') {
    newState.step = 'business_name';
    return {
      state: newState,
      response: "Great! Let's set up your booking system. What is your business name?",
    };
  }

  switch (newState.step) {
    case 'welcome':
      return {
        state: newState,
        response: 'Hi! I can help you create your booking system. Just say "Create my booking system" to get started.',
      };

    case 'business_name':
      newState.businessName = msg;
      newState.category = inferCategory(msg);
      newState.step = 'business_category';
      return {
        state: newState,
        response: `Nice! What type of business is ${msg}? (e.g., Salon, Clinic, Car Service, Tutoring, Sports Court)`,
      };

    case 'business_category':
      newState.category = inferCategory(msg);
      newState.step = 'services';
      return {
        state: newState,
        response: `Got it — ${getCategoryLabel(newState.category)}. What services do you provide? List them separated by commas.`,
      };

    case 'services': {
      const parsed = parseNaturalLanguageSetup(msg);
      if (parsed.hasComplexData) {
        const summary = buildConfirmationSummary(parsed, newState);
        newState.pendingConfirmation = {
          summary,
          field: 'complex',
          parsed: parsed as unknown as Record<string, unknown>,
        };
        return {
          state: newState,
          response: `I understood this:\n\n${summary}\n\nIs this correct? (Confirm or Edit)`,
        };
      }
      const services = msg.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      newState.services = services.map((name) => ({ name }));
      newState.step = 'service_prices';
      return {
        state: newState,
        response: `Services: ${services.join(', ')}.\n\nWhat are the prices? You can say something like "Haircut ₹300, Beard trim ₹150, Facial ₹500"`,
      };
    }

    case 'service_prices': {
      const prices = parsePrices(msg, newState.services || []);
      newState.services = prices;
      newState.step = 'service_durations';
      return {
        state: newState,
        response: 'What is the duration for each service? e.g., "Haircut 30 min, Facial 45 min, Hair spa 60 min"',
      };
    }

    case 'service_durations': {
      const withDurations = parseDurations(msg, newState.services || []);
      newState.services = withDurations;
      newState.step = 'staff';
      return {
        state: newState,
        response: 'Who are your team members? List their names (e.g., "Ravi, Ajay, and Kumar")',
      };
    }

    case 'staff': {
      const parsed = parseNaturalLanguageSetup(msg);
      if (parsed.staff?.length) {
        newState.staff = parsed.staff;
        if (parsed.workingHours) newState.workingHours = parsed.workingHours;
        if (parsed.breaks) newState.breaks = parsed.breaks;
        const summary = buildConfirmationSummary(parsed, newState);
        newState.pendingConfirmation = {
          summary,
          field: 'staff_services',
          parsed: parsed as unknown as Record<string, unknown>,
        };
        newState.step = 'working_hours';
        return {
          state: newState,
          response: `I understood this:\n\n${summary}\n\nIs this correct? (Confirm or Edit)`,
        };
      }
      const names = msg.split(/[,;&]|\band\b/i).map((s) => s.trim()).filter(Boolean);
      newState.staff = names.map((name) => ({ name }));
      newState.step = 'staff_services';
      return {
        state: newState,
        response: `Team: ${names.join(', ')}.\n\nWhich staff can perform each service? e.g., "Ravi and Ajay do haircuts, Kumar handles facial and spa"`,
      };
    }

    case 'staff_services': {
      const assignments = parseStaffServices(msg, newState.services || [], newState.staff || []);
      newState.staff = assignments;
      newState.step = 'working_hours';
      return {
        state: newState,
        response: 'What are your working hours? e.g., "Open 10 AM to 9 PM, closed Sundays"',
      };
    }

    case 'working_hours': {
      const hours = parseWorkingHours(msg);
      if (hours) newState.workingHours = hours.hours;
      if (hours?.breaks) newState.breaks = hours.breaks;
      newState.step = 'breaks';
      return {
        state: newState,
        response: hours?.breaks?.length
          ? `Hours set! Break: ${hours.breaks.map((b) => `${b.start}-${b.end}`).join(', ')}.\n\nAny holidays or days off? (Say "none" to skip)`
          : 'Any break times? e.g., "Lunch break 1 PM to 2 PM" (Say "none" to skip)',
      };
    }

    case 'breaks': {
      if (!/^(none|no|skip|n\/a)/i.test(msg)) {
        const breaks = parseBreaks(msg);
        if (breaks.length) newState.breaks = [...(newState.breaks || []), ...breaks];
      }
      newState.step = 'holidays';
      return {
        state: newState,
        response: 'Any upcoming holidays? (Say "none" to skip)',
      };
    }

    case 'holidays':
      if (!/^(none|no|skip|n\/a)/i.test(msg)) {
        newState.holidays = msg.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      }
      newState.step = 'booking_rules';
      return {
        state: newState,
        response: 'How far in advance can customers book? (e.g., "30 days" — or say "default")',
      };

    case 'booking_rules':
      const days = msg.match(/(\d+)\s*days?/i);
      if (days) newState.advanceBookingDays = parseInt(days[1]);
      newState.step = 'confirm';
      return {
        state: newState,
        response: buildFinalSummary(newState) + '\n\nShall I create your booking system? (Yes to confirm)',
      };

    case 'confirm':
      if (/^(yes|confirm|create|go|ok|yep)/i.test(msg)) {
        newState.step = 'complete';
        return {
          state: newState,
          response: '✅ Your booking system is ready!',
        };
      }
      return {
        state: newState,
        response: 'Please confirm with "Yes" to create your booking system, or tell me what to change.',
      };

    default:
      return { state: newState, response: 'How can I help you?' };
  }
}

function applyConfirmedData(state: OnboardingState, pending: NonNullable<OnboardingState['pendingConfirmation']>): OnboardingState {
  const parsed = pending.parsed as ReturnType<typeof parseNaturalLanguageSetup>;
  const newState = { ...state };
  if (parsed.services) newState.services = parsed.services;
  if (parsed.staff) newState.staff = parsed.staff;
  if (parsed.workingHours) newState.workingHours = parsed.workingHours;
  if (parsed.breaks) newState.breaks = parsed.breaks;
  if (!newState.step || newState.step === 'services') newState.step = 'working_hours';
  return newState;
}

function getStepQuestion(state: OnboardingState): string {
  switch (state.step) {
    case 'business_name': return 'What is your business name?';
    case 'services': return 'What services do you provide?';
    case 'staff': return 'Who are your team members?';
    case 'working_hours': return 'What are your working hours?';
    default: return 'Please provide the information again.';
  }
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    beauty: 'Beauty / Salon', health: 'Health / Clinic', auto: 'Auto Service',
    education: 'Education / Tutoring', sports: 'Sports', fitness: 'Fitness',
    home: 'Home Services', professional: 'Professional Services',
  };
  return labels[category] || category;
}

function parseNaturalLanguageSetup(text: string) {
  const result: {
    hasComplexData: boolean;
    services?: Array<{ name: string; price?: number; duration?: number }>;
    staff?: Array<{ name: string; services?: string[] }>;
    workingHours?: Record<number, { open: string; close: string }>;
    breaks?: Array<{ start: string; end: string; label?: string }>;
  } = { hasComplexData: false };

  const hoursMatch = text.match(/(?:open|from)\s*(\d{1,2})(?::(\d{2}))?\s*(?:am|to|-)\s*(\d{1,2})(?::(\d{2}))?\s*(?:pm)?/i);
  if (hoursMatch) {
    result.workingHours = Object.fromEntries(
      [1, 2, 3, 4, 5, 6].map((d) => [
        d,
        {
          open: to24h(parseInt(hoursMatch[1]), hoursMatch[2], false),
          close: to24h(parseInt(hoursMatch[3]), hoursMatch[4], true),
        },
      ])
    );
    result.hasComplexData = true;
  }

  const breakMatch = text.match(/(?:lunch|break).*?(\d{1,2})(?::(\d{2}))?\s*(?:to|-)\s*(\d{1,2})(?::(\d{2}))?/i);
  if (breakMatch) {
    result.breaks = [{
      start: to24h(parseInt(breakMatch[1]), breakMatch[2], false),
      end: to24h(parseInt(breakMatch[3]), breakMatch[4], false),
      label: 'Break',
    }];
    result.hasComplexData = true;
  }

  const staffNames = [...text.matchAll(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g)].map((m) => m[1]);
  if (staffNames.length >= 2) {
    result.staff = staffNames.map((name) => ({ name }));
    result.hasComplexData = true;
  }

  const serviceList = text.match(/(?:haircut|beard|facial|spa|trim|color|wash)/gi);
  if (serviceList) {
    result.services = [...new Set(serviceList.map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()))].map((name) => ({
      name, price: 300, duration: 30,
    }));
    result.hasComplexData = true;
  }

  return result;
}

function buildConfirmationSummary(parsed: ReturnType<typeof parseNaturalLanguageSetup>, state: OnboardingState): string {
  const lines: string[] = [];
  if (parsed.workingHours || state.workingHours) {
    const h = parsed.workingHours || state.workingHours;
    const first = h?.[1];
    if (first) lines.push(`Business hours: ${formatTime12(first.open)}–${formatTime12(first.close)}`);
  }
  if (parsed.breaks?.length) {
    lines.push(`Break: ${parsed.breaks.map((b) => `${formatTime12(b.start)}–${formatTime12(b.end)}`).join(', ')}`);
  }
  if (parsed.staff?.length) {
    lines.push(`Staff: ${parsed.staff.map((s) => s.name).join(', ')}`);
  }
  if (parsed.services?.length) {
    lines.push(`Services: ${parsed.services.map((s) => s.name).join(', ')}`);
  }
  return lines.join('\n');
}

function buildFinalSummary(state: OnboardingState): string {
  const lines = [
    `📋 **${state.businessName}**`,
    `Category: ${getCategoryLabel(state.category || 'beauty')}`,
    `Services: ${state.services?.map((s) => `${s.name} (₹${s.price || 0}, ${s.duration || 30}min)`).join(', ')}`,
    `Staff: ${state.staff?.map((s) => s.name).join(', ')}`,
    `Hours: Mon-Sat ${state.workingHours?.[1] ? `${formatTime12(state.workingHours[1].open)}–${formatTime12(state.workingHours[1].close)}` : '10 AM–9 PM'}`,
  ];
  if (state.breaks?.length) {
    lines.push(`Breaks: ${state.breaks.map((b) => `${formatTime12(b.start)}–${formatTime12(b.end)}`).join(', ')}`);
  }
  return lines.join('\n');
}

function parsePrices(text: string, services: Array<{ name: string; price?: number; duration?: number }>) {
  const result = [...services];
  const pricePattern = /(\w[\w\s]*?)\s*[₹$]?\s*(\d+)/gi;
  let match;
  while ((match = pricePattern.exec(text)) !== null) {
    const name = match[1].trim().toLowerCase();
    const price = parseInt(match[2]);
    const idx = result.findIndex((s) => s.name.toLowerCase().includes(name) || name.includes(s.name.toLowerCase()));
    if (idx >= 0) result[idx] = { ...result[idx], price };
  }
  if (!result.some((s) => s.price)) {
    const amounts = text.match(/\d+/g);
    if (amounts) {
      amounts.forEach((a, i) => {
        if (result[i]) result[i] = { ...result[i], price: parseInt(a) };
      });
    }
  }
  return result.map((s) => ({ ...s, price: s.price || 300 }));
}

function parseDurations(text: string, services: Array<{ name: string; price?: number; duration?: number }>) {
  const result = [...services];
  const durPattern = /(\w[\w\s]*?)\s*(\d+)\s*min/gi;
  let match;
  while ((match = durPattern.exec(text)) !== null) {
    const name = match[1].trim().toLowerCase();
    const duration = parseInt(match[2]);
    const idx = result.findIndex((s) => s.name.toLowerCase().includes(name));
    if (idx >= 0) result[idx] = { ...result[idx], duration };
  }
  if (!result.some((s) => s.duration)) {
    const nums = text.match(/\d+/g);
    if (nums) {
      nums.forEach((n, i) => {
        if (result[i]) result[i] = { ...result[i], duration: parseInt(n) };
      });
    }
  }
  return result.map((s) => ({ ...s, duration: s.duration || 30 }));
}

function parseStaffServices(
  text: string,
  services: Array<{ name: string }>,
  staff: Array<{ name: string }>
) {
  const result = staff.map((s) => ({ ...s, services: [] as string[] }));
  const lower = text.toLowerCase();

  for (const member of result) {
    const nameLower = member.name.toLowerCase();
    if (lower.includes(nameLower)) {
      for (const svc of services) {
        if (lower.includes(svc.name.toLowerCase())) {
          member.services!.push(svc.name);
        }
      }
    }
  }

  const doPattern = /([\w\s,]+)\s+(?:do|does|handle|cut)\s+([\w\s,and]+)/gi;
  let match;
  while ((match = doPattern.exec(text)) !== null) {
    const names = match[1].split(/\s+and\s+|,\s*/).map((n) => n.trim());
    const svcNames = match[2].split(/\s+and\s+|,\s*/).map((n) => n.trim());
    for (const name of names) {
      const member = result.find((s) => s.name.toLowerCase().includes(name.toLowerCase()));
      if (member) {
        for (const svcName of svcNames) {
          const svc = services.find((s) => s.name.toLowerCase().includes(svcName.toLowerCase()));
          if (svc && !member.services!.includes(svc.name)) {
            member.services!.push(svc.name);
          }
        }
      }
    }
  }

  return result.map((s) => ({
    ...s,
    services: s.services?.length ? s.services : services.map((svc) => svc.name),
  }));
}

function parseWorkingHours(text: string) {
  const hours: Record<number, { open: string; close: string }> = {};
  const openMatch = text.match(/(?:open|from)\s*(\d{1,2})(?::(\d{2}))?\s*(?:am)?\s*(?:to|-)\s*(\d{1,2})(?::(\d{2}))?\s*(?:pm)?/i);
  if (openMatch) {
    const open = to24h(parseInt(openMatch[1]), openMatch[2], false);
    const close = to24h(parseInt(openMatch[3]), openMatch[4], true);
    for (let d = 0; d <= 6; d++) {
      hours[d] = { open, close };
    }
    if (/sunday|sun/i.test(text) && /closed/i.test(text)) {
      hours[0] = { open: '00:00', close: '00:00' };
    }
    if (/mon.*sat/i.test(text)) {
      for (let d = 1; d <= 6; d++) hours[d] = { open, close };
      hours[0] = { open: '00:00', close: '00:00' };
    }
  }

  const breaks = parseBreaks(text);
  return { hours: Object.keys(hours).length ? hours : undefined, breaks };
}

function parseBreaks(text: string): Array<{ start: string; end: string; label?: string }> {
  const breaks: Array<{ start: string; end: string; label?: string }> = [];
  const pattern = /(?:(lunch|break)\s*)?(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)?\s*(?:to|-)\s*(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)?/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match[0].toLowerCase().includes('open')) continue;
    breaks.push({
      start: to24h(parseInt(match[2]), match[3], match[0].includes('pm') && parseInt(match[2]) < 12),
      end: to24h(parseInt(match[4]), match[5], true),
      label: match[1] || 'Break',
    });
  }
  return breaks;
}

function to24h(hour: number, min?: string, isPM?: boolean): string {
  let h = hour;
  if (isPM && h < 12) h += 12;
  if (!isPM && h === 12) h = 0;
  if (h >= 10 && h <= 21 && !min && !isPM && hour < 10) {
    // infer PM for business hours like "9" meaning 9 PM
  }
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

  const staffRecords = await Promise.all(
    (state.staff || [{ name: 'Staff' }]).map((s) =>
      prisma.staff.create({
        data: { businessId: business.id, name: s.name, role: 'Staff' },
      })
    )
  );

  for (const staffMember of state.staff || []) {
    const staffRecord = staffRecords.find((s) => s.name === staffMember.name);
    if (!staffRecord) continue;
    const assignedServices = staffMember.services || serviceRecords.map((s) => s.name);
    for (const svcName of assignedServices) {
      const svc = serviceRecords.find((s) => s.name === svcName);
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
        day: parseInt(day),
        openingTime: times.open,
        closingTime: times.close,
        isClosed,
      },
    });
    for (const staffRecord of staffRecords) {
      await prisma.staffHour.create({
        data: {
          staffId: staffRecord.id,
          day: parseInt(day),
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
