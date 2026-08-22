export type BookingStepType =
  | 'service'
  | 'staff'
  | 'consultation_type'
  | 'vehicle'
  | 'package'
  | 'subject'
  | 'court'
  | 'duration'
  | 'players'
  | 'location'
  | 'date'
  | 'time'
  | 'customer_info'
  | 'queue_type';

export interface BookingStep {
  id: string;
  type: BookingStepType;
  label: string;
  required: boolean;
  options?: string[];
}

export interface BusinessBookingSchema {
  category: string;
  steps: BookingStep[];
  staffRequired: boolean;
  showQueueOption?: boolean;
  customFields?: Array<{
    id: string;
    label: string;
    type: 'text' | 'select' | 'number';
    options?: string[];
  }>;
}

export type SchemaKind =
  | 'beauty'
  | 'wellness'
  | 'medical'
  | 'dental'
  | 'fitness'
  | 'education'
  | 'consultation'
  | 'legal'
  | 'professional'
  | 'venue'
  | 'tour'
  | 'home'
  | 'auto'
  | 'sports'
  | 'generic';

export interface BusinessCategory {
  id: string;
  name: string;
  icon: string;
  schema: SchemaKind;
  aliases: string[];
}

function steps(items: BookingStep[], extras: Partial<BusinessBookingSchema> = {}): Omit<BusinessBookingSchema, 'category'> {
  return { steps: items, staffRequired: extras.staffRequired ?? true, ...extras };
}

const SCHEMA_KINDS: Record<SchemaKind, Omit<BusinessBookingSchema, 'category'>> = {
  beauty: steps([
    { id: 'service', type: 'service', label: 'Choose Service', required: true },
    { id: 'staff', type: 'staff', label: 'Choose Staff', required: true },
    { id: 'date', type: 'date', label: 'Choose Date', required: true },
    { id: 'time', type: 'time', label: 'Choose Time', required: true },
    { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
  ]),
  wellness: steps([
    { id: 'service', type: 'service', label: 'Choose Service', required: true },
    { id: 'staff', type: 'staff', label: 'Choose Practitioner', required: true },
    { id: 'date', type: 'date', label: 'Choose Date', required: true },
    { id: 'time', type: 'time', label: 'Choose Time', required: true },
    { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
  ]),
  medical: steps(
    [
      { id: 'consultation', type: 'consultation_type', label: 'Consultation Type', required: true },
      { id: 'staff', type: 'staff', label: 'Choose Doctor', required: true },
      { id: 'queue', type: 'queue_type', label: 'Appointment or Queue', required: true, options: ['Appointment', 'Walk-in Queue'] },
      { id: 'date', type: 'date', label: 'Choose Date', required: true },
      { id: 'time', type: 'time', label: 'Choose Time', required: true },
      { id: 'customer', type: 'customer_info', label: 'Patient Details', required: true },
    ],
    { showQueueOption: true }
  ),
  dental: steps([
    { id: 'service', type: 'service', label: 'Choose Treatment', required: true },
    { id: 'staff', type: 'staff', label: 'Choose Dentist', required: true },
    { id: 'date', type: 'date', label: 'Choose Date', required: true },
    { id: 'time', type: 'time', label: 'Choose Time', required: true },
    { id: 'customer', type: 'customer_info', label: 'Patient Details', required: true },
  ]),
  fitness: steps(
    [
      { id: 'service', type: 'service', label: 'Choose Session', required: true },
      { id: 'staff', type: 'staff', label: 'Choose Trainer', required: false },
      { id: 'date', type: 'date', label: 'Choose Date', required: true },
      { id: 'time', type: 'time', label: 'Choose Time', required: true },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    { staffRequired: false }
  ),
  education: steps(
    [
      { id: 'subject', type: 'subject', label: 'Choose Subject', required: true },
      { id: 'staff', type: 'staff', label: 'Choose Tutor', required: true },
      { id: 'date', type: 'date', label: 'Choose Date', required: true },
      { id: 'time', type: 'time', label: 'Choose Time', required: true },
      { id: 'customer', type: 'customer_info', label: 'Student Details', required: true },
    ],
    {
      customFields: [
        { id: 'student_name', label: 'Student Name', type: 'text' },
        { id: 'recurring', label: 'Recurring Schedule', type: 'select', options: ['One-time', 'Weekly', 'Bi-weekly'] },
      ],
    }
  ),
  consultation: steps(
    [
      { id: 'service', type: 'service', label: 'Appointment Type', required: true },
      { id: 'staff', type: 'staff', label: 'Choose Person', required: true },
      { id: 'duration', type: 'duration', label: 'Duration', required: true },
      { id: 'date', type: 'date', label: 'Choose Date', required: true },
      { id: 'time', type: 'time', label: 'Choose Time', required: true },
      { id: 'location', type: 'location', label: 'Location (optional)', required: false },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    { customFields: [{ id: 'meeting_place', label: 'Location', type: 'text' }] }
  ),
  legal: steps(
    [
      { id: 'service', type: 'service', label: 'Choose Service', required: true },
      { id: 'staff', type: 'staff', label: 'Choose Lawyer', required: false },
      { id: 'date', type: 'date', label: 'Choose Date', required: true },
      { id: 'time', type: 'time', label: 'Choose Time', required: true },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    { staffRequired: false }
  ),
  professional: steps(
    [
      { id: 'package', type: 'package', label: 'Choose Package', required: true },
      { id: 'date', type: 'date', label: 'Event Date', required: true },
      { id: 'duration', type: 'duration', label: 'Event Duration', required: true },
      { id: 'location', type: 'location', label: 'Event Location', required: true },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    { staffRequired: false, customFields: [{ id: 'event_location', label: 'Event Location', type: 'text' }] }
  ),
  venue: steps(
    [
      { id: 'service', type: 'service', label: 'Choose Space', required: true },
      { id: 'location', type: 'location', label: 'Choose Room', required: true },
      { id: 'duration', type: 'duration', label: 'Duration', required: true },
      { id: 'date', type: 'date', label: 'Choose Date', required: true },
      { id: 'time', type: 'time', label: 'Choose Time', required: true },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    { staffRequired: false, customFields: [{ id: 'room', label: 'Room / desk', type: 'text' }] }
  ),
  tour: steps(
    [
      { id: 'service', type: 'service', label: 'Choose Tour', required: true },
      { id: 'date', type: 'date', label: 'Tour Date', required: true },
      { id: 'duration', type: 'duration', label: 'Duration', required: true },
      { id: 'location', type: 'location', label: 'Meeting Point', required: true },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    { staffRequired: false, customFields: [{ id: 'meeting_point', label: 'Meeting Point', type: 'text' }] }
  ),
  home: steps(
    [
      { id: 'service', type: 'service', label: 'Choose Service', required: true },
      { id: 'date', type: 'date', label: 'Choose Date', required: true },
      { id: 'time', type: 'time', label: 'Choose Time', required: true },
      { id: 'location', type: 'location', label: 'Service Address', required: true },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    { staffRequired: false, customFields: [{ id: 'address', label: 'Service Address', type: 'text' }] }
  ),
  auto: steps(
    [
      { id: 'vehicle', type: 'vehicle', label: 'Vehicle Details', required: true },
      { id: 'service', type: 'service', label: 'Choose Service', required: true },
      { id: 'date', type: 'date', label: 'Drop-off Date', required: true },
      { id: 'time', type: 'time', label: 'Drop-off Time', required: true },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    {
      staffRequired: false,
      customFields: [
        { id: 'vehicle_model', label: 'Vehicle Model', type: 'text' },
        { id: 'vehicle_number', label: 'Vehicle Number', type: 'text' },
      ],
    }
  ),
  sports: steps(
    [
      { id: 'service', type: 'service', label: 'Choose Sport', required: true },
      { id: 'court', type: 'court', label: 'Choose Court', required: true },
      { id: 'players', type: 'players', label: 'Number of Players', required: true },
      { id: 'date', type: 'date', label: 'Choose Date', required: true },
      { id: 'time', type: 'time', label: 'Choose Time', required: true },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    { staffRequired: false, customFields: [{ id: 'players', label: 'Number of Players', type: 'number' }] }
  ),
  generic: steps(
    [
      { id: 'service', type: 'service', label: 'Choose Service', required: true },
      { id: 'staff', type: 'staff', label: 'Choose Staff', required: false },
      { id: 'date', type: 'date', label: 'Choose Date', required: true },
      { id: 'time', type: 'time', label: 'Choose Time', required: true },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    { staffRequired: false }
  ),
};

function cat(id: string, name: string, icon: string, schema: SchemaKind, aliases: string[]): BusinessCategory {
  return { id, name, icon, schema, aliases };
}

/** Canonical industry catalog. Ids are stored on Business.category. */
export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  cat('beauty', 'Beauty Salons', '💇', 'beauty', ['beauty', 'beauty salon', 'beauty salons', 'saloon', 'saloons', 'parlour', 'parlor', 'spa', 'barbers/saloon']),
  cat('salon', 'Salon', '✂️', 'beauty', ['salon', 'salons']),
  cat('barber', 'Barbers', '💈', 'beauty', ['barber', 'barbers', 'barbershop', 'barber shop']),
  cat('hairdresser', 'Hairdressers', '💇', 'beauty', ['hairdresser', 'hairdressers', 'hair dresser', 'hairdressing']),
  cat('lashes', 'Lashes', '👁️', 'beauty', ['lash', 'lashes', 'eyelash', 'eyelashes', 'lash extension', 'lash extensions']),
  cat('tattoo', 'Tattoo Studio', '🖋️', 'beauty', ['tattoo', 'tattoos', 'tattoo studio', 'tattoo shop', 'tattoo parlour', 'tattoo parlor']),
  cat('skincare', 'Skincare Clinics', '✨', 'beauty', ['skincare', 'skin care', 'skincare clinic', 'skincare clinics', 'dermatology clinic']),
  cat('health', 'Health & Wellness', '🏥', 'medical', ['health', 'clinic', 'hospital', 'healthcare']),
  cat('doctors', 'Doctors', '🩺', 'medical', ['doctor', 'doctors', 'general practitioner']),
  cat('physician', 'Physician', '🩺', 'medical', ['physician', 'physicians']),
  cat('dental', 'Dental', '🦷', 'dental', ['dental', 'dentist', 'dentists', 'dentistry', 'dental clinic']),
  cat('medical', 'Medical Scheduling', '🏥', 'medical', ['medical', 'medical scheduling', 'medical appointments']),
  cat('chiropractor', 'Chiropractors', '🦴', 'wellness', ['chiropractor', 'chiropractors', 'chiropractic']),
  cat('acupuncture', 'Acupuncture', '🪡', 'wellness', ['acupuncture', 'acupuncturist']),
  cat('therapy', 'Therapy', '🧠', 'wellness', ['therapy', 'therapist', 'therapists', 'counselling', 'counseling', 'psychotherapy']),
  cat('massage', 'Massage Therapists', '💆', 'wellness', ['massage', 'massage therapist', 'massage therapists', 'massage therapy']),
  cat('reiki', 'Reiki', '🙏', 'wellness', ['reiki']),
  cat('yoga', 'Yoga', '🧘', 'wellness', ['yoga', 'yoga studio']),
  cat('pilates', 'Pilates', '🤸', 'wellness', ['pilates', 'pilates studio']),
  cat('fitness', 'Fitness Studios', '💪', 'fitness', ['fitness', 'fitness studio', 'fitness studios', 'gym', 'workout']),
  cat('personal_trainer', 'Personal Trainers', '🏋️', 'fitness', ['personal trainer', 'personal trainers', 'personal training']),
  cat('auto', 'Auto Service', '🚗', 'auto', ['auto', 'car', 'garage', 'mechanic', 'vehicle', 'workshop']),
  cat('education', 'Education & Tutoring', '📚', 'education', ['education', 'tutor', 'tutors', 'tuition', 'tutoring', 'teacher', 'academy']),
  cat('coaching', 'Coaching', '🎯', 'education', ['coaching', 'coach', 'life coach', 'business coach']),
  cat('music', 'Music Lessons', '🎵', 'education', ['music', 'music lesson', 'music lessons', 'music teacher', 'instrument lessons']),
  cat('mentor', 'Mentors', '🌟', 'consultation', ['mentor', 'mentors', 'mentoring', 'mentorship']),
  cat('sports', 'Sports & Recreation', '⚽', 'sports', ['sports', 'sport', 'court', 'badminton', 'tennis', 'cricket', 'arena']),
  cat('home', 'Home Services', '🏠', 'home', ['home', 'home service', 'home services', 'plumber', 'electrician', 'repair']),
  cat('cleaning', 'Cleaning', '🧹', 'home', ['cleaning', 'cleaner', 'cleaners', 'housekeeping', 'maid service']),
  cat('professional', 'Professional Services', '💼', 'professional', ['professional', 'photographer', 'photography', 'wedding', 'event planner']),
  cat('legal', 'Legal Services', '⚖️', 'legal', ['legal', 'legal services', 'lawyer', 'lawyers', 'attorney', 'advocate', 'law firm', 'counsel', 'solicitor', 'notary', 'litigation']),
  cat('meeting_room', 'Meeting Rooms', '🚪', 'venue', ['meeting room', 'meeting rooms', 'conference room', 'boardroom']),
  cat('hub', 'Hub / coworking', '🏢', 'venue', ['hubspot', 'hubspots', 'hub spots', 'coworking', 'co working', 'hot desk', 'hotdesk', 'flex desk', 'shared office']),
  cat('wine_tour', 'Wine Tour Booking', '🍷', 'tour', ['wine tour', 'wine tours', 'wine tour booking', 'vineyard tour', 'winery']),
  cat('small_business', 'Small Business', '🏪', 'generic', ['small business', 'small businesses', 'general business']),
  cat('vip', 'VIP', '⭐', 'consultation', ['vip', 'vips']),
  cat('mla', 'MLA', '🏛️', 'consultation', ['mla', 'mlas', 'member of legislative assembly']),
  cat('mp', 'MP', '🏛️', 'consultation', ['mp', 'mps', 'member of parliament', 'members of parliament']),
  cat('leader', 'Leader', '👔', 'consultation', ['leader', 'leaders', 'office hours', 'constituency']),
];

const CATEGORY_BY_ID = new Map(BUSINESS_CATEGORIES.map((c) => [c.id, c]));

type AliasHit = { id: string; alias: string };
const ALIAS_HITS: AliasHit[] = BUSINESS_CATEGORIES.flatMap((c) =>
  [c.id, c.name, ...c.aliases].map((alias) => ({
    id: c.id,
    alias: alias.toLowerCase().replace(/[_/]+/g, ' ').replace(/\s+/g, ' ').trim(),
  }))
).sort((a, b) => b.alias.length - a.alias.length);

const CATEGORY_SCHEMAS: Record<string, BusinessBookingSchema> = Object.fromEntries(
  BUSINESS_CATEGORIES.map((c) => {
    const kind = SCHEMA_KINDS[c.schema];
    return [
      c.id,
      {
        category: c.id,
        steps: kind.steps.map((s) => ({ ...s })),
        staffRequired: kind.staffRequired,
        showQueueOption: kind.showQueueOption,
        customFields: kind.customFields,
      },
    ];
  })
);

const EXTRA_INFER_RULES: Array<{ id: string; pattern: RegExp }> = [
  { id: 'wine_tour', pattern: /\bwine\s*(tour|tasting|booking)\b/ },
  { id: 'meeting_room', pattern: /\bmeeting\s*rooms?\b|\bconference\s*rooms?\b/ },
  { id: 'hub', pattern: /\bhub\s*spots?\b|\bhubspots?\b|\bcowork(?:ing)?\b|\bhot[\s-]?desks?\b/ },
  { id: 'personal_trainer', pattern: /\bpersonal\s*trainers?\b|\bpersonal\s*training\b/ },
  { id: 'tattoo', pattern: /\btattoo/ },
  { id: 'lashes', pattern: /\blash(es)?\b|\beyelash/ },
  { id: 'skincare', pattern: /\bskin\s*care\b|\bskincare\b/ },
  { id: 'hairdresser', pattern: /\bhair\s*dressers?\b|\bhairdressers?\b/ },
  { id: 'barber', pattern: /\bbarbers?\b|\bbarber\s*shop\b/ },
  { id: 'pilates', pattern: /\bpilates\b/ },
  { id: 'yoga', pattern: /\byoga\b/ },
  { id: 'reiki', pattern: /\breiki\b/ },
  { id: 'massage', pattern: /\bmassage\b/ },
  { id: 'acupuncture', pattern: /\bacupunct/ },
  { id: 'chiropractor', pattern: /\bchiropract/ },
  { id: 'cleaning', pattern: /\bclean(?:ing|ers?)?\b/ },
  { id: 'music', pattern: /\bmusic\s*lessons?\b|\bmusic\s*teacher\b/ },
  { id: 'coaching', pattern: /\bcoach(?:ing|es)?\b/ },
  { id: 'mentor', pattern: /\bmentors?\b|\bmentorship\b/ },
  { id: 'mla', pattern: /\bmlas?\b/ },
  { id: 'mp', pattern: /\bmps?\b|\bmember of parliament\b/ },
  { id: 'vip', pattern: /\bvips?\b/ },
  { id: 'leader', pattern: /\bleaders?\b|\bconstituency\b/ },
  { id: 'legal', pattern: /\b(lawyer|lawyers|legal|advocate|attorney|litigation|notary|law\s*firm|counsel|solicitor)\b/ },
  { id: 'dental', pattern: /\b(dental|dentist|dentists|dentistry)\b/ },
  { id: 'physician', pattern: /\bphysicians?\b/ },
  { id: 'doctors', pattern: /\bdoctors?\b/ },
  { id: 'medical', pattern: /\bmedical\s*schedul|\bmedical\s*appointment/ },
  { id: 'therapy', pattern: /\btherap(?:y|ist)s?\b|\bcounsell?ing\b/ },
  { id: 'beauty', pattern: /\b(saloon|beauty|parlour|parlor|haircut|hair\s*cut|hair\s*spa|facial|makeup|manicure|pedicure)\b/ },
  { id: 'health', pattern: /\b(clinic|hospital|healthcare)\b/ },
  { id: 'auto', pattern: /\b(car|auto|vehicle|garage|mechanic|workshop)\b/ },
  { id: 'professional', pattern: /\b(photo|photograph|photographer|wedding|event\s*planner)\b/ },
  { id: 'education', pattern: /\b(tutor|tuition|teach|teacher|education|academy)\b/ },
  { id: 'sports', pattern: /\b(sport|court|badminton|tennis|cricket|arena)\b/ },
  { id: 'fitness', pattern: /\b(fitness|workout|gym)\b/ },
  { id: 'home', pattern: /\b(plumb|plumber|electric|electrician|repair|home\s*service)\b/ },
  { id: 'small_business', pattern: /\bsmall\s*business(es)?\b|\bgeneral\s*business\b/ },
];

/** Words the owner might negate when correcting a wrong guess ("it is not beauty"). */
const CATEGORY_NOUNS = Array.from(
  new Set(
    BUSINESS_CATEGORIES.flatMap((c) => [c.id, c.name, ...c.aliases])
      .map((n) => n.toLowerCase().replace(/[_/]+/g, ' ').trim())
      .filter((n) => n.length > 1 && n.length < 28 && !n.includes(' of '))
  )
);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function stripNegatedCategoryPhrases(text: string): string {
  const nouns = CATEGORY_NOUNS.map(escapeRegExp).join('|');
  return text.replace(new RegExp(`\\b(?:not|n't|isnt|isn't)\\s+(?:a\\s+|an\\s+)?(?:${nouns})\\b`, 'gi'), ' ');
}

function foldCategoryText(raw: string): string {
  return raw.toLowerCase().replace(/[_/,-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function normalizeCategory(raw: string): string | undefined {
  const folded = foldCategoryText(raw);
  if (!folded) return undefined;
  const compact = folded.replace(/\s+/g, '_');
  if (CATEGORY_BY_ID.has(folded)) return folded;
  if (CATEGORY_BY_ID.has(compact)) return compact;
  for (const hit of ALIAS_HITS) {
    if (hit.alias === folded) return hit.id;
  }
  return undefined;
}

export function inferCategory(text: string): string | undefined {
  const lower = stripNegatedCategoryPhrases(text).toLowerCase();
  const folded = foldCategoryText(lower);
  const whole = normalizeCategory(folded);
  if (whole) return whole;
  for (const hit of ALIAS_HITS) {
    if (hit.alias.length < 3) continue;
    const re = new RegExp(`\\b${escapeRegExp(hit.alias)}\\b`, 'i');
    if (re.test(lower)) return hit.id;
  }
  for (const rule of EXTRA_INFER_RULES) {
    if (rule.pattern.test(lower)) return rule.id;
  }
  return undefined;
}

export function resolveCategoryId(raw?: string | null): string {
  if (!raw?.trim()) return 'beauty';
  const normalized = normalizeCategory(raw);
  if (normalized) return normalized;
  const inferred = inferCategory(raw);
  if (inferred) return inferred;
  return raw.toLowerCase().trim().slice(0, 40);
}

export function getBookingSchema(category: string): BusinessBookingSchema {
  const key = resolveCategoryId(category);
  return CATEGORY_SCHEMAS[key] || CATEGORY_SCHEMAS.beauty;
}

export function getCategoryDisplayName(category: string): string {
  const resolved = normalizeCategory(category) || category.toLowerCase();
  return CATEGORY_BY_ID.get(resolved)?.name || category;
}

export function getOnboardingCategoryIds(): string {
  return BUSINESS_CATEGORIES.map((c) => c.id).join(', ');
}

/** Public discover / home chips. */
export const CATEGORIES = BUSINESS_CATEGORIES.map((c) => ({
  id: c.id,
  name: c.name,
  icon: c.icon,
}));
