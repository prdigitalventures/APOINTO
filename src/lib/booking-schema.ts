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

const CATEGORY_SCHEMAS: Record<string, BusinessBookingSchema> = {
  salon: {
    category: 'salon',
    steps: [
      { id: 'service', type: 'service', label: 'Choose Service', required: true },
      { id: 'staff', type: 'staff', label: 'Choose Staff', required: true },
      { id: 'date', type: 'date', label: 'Choose Date', required: true },
      { id: 'time', type: 'time', label: 'Choose Time', required: true },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    staffRequired: true,
  },
  beauty: {
    category: 'beauty',
    steps: [
      { id: 'service', type: 'service', label: 'Choose Service', required: true },
      { id: 'staff', type: 'staff', label: 'Choose Staff', required: true },
      { id: 'date', type: 'date', label: 'Choose Date', required: true },
      { id: 'time', type: 'time', label: 'Choose Time', required: true },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    staffRequired: true,
  },
  health: {
    category: 'health',
    steps: [
      { id: 'consultation', type: 'consultation_type', label: 'Consultation Type', required: true },
      { id: 'staff', type: 'staff', label: 'Choose Doctor', required: true },
      { id: 'queue', type: 'queue_type', label: 'Appointment or Queue', required: true, options: ['Appointment', 'Walk-in Queue'] },
      { id: 'date', type: 'date', label: 'Choose Date', required: true },
      { id: 'time', type: 'time', label: 'Choose Time', required: true },
      { id: 'customer', type: 'customer_info', label: 'Patient Details', required: true },
    ],
    staffRequired: true,
    showQueueOption: true,
  },
  auto: {
    category: 'auto',
    steps: [
      { id: 'vehicle', type: 'vehicle', label: 'Vehicle Details', required: true },
      { id: 'service', type: 'service', label: 'Choose Service', required: true },
      { id: 'date', type: 'date', label: 'Drop-off Date', required: true },
      { id: 'time', type: 'time', label: 'Drop-off Time', required: true },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    staffRequired: false,
    customFields: [
      { id: 'vehicle_model', label: 'Vehicle Model', type: 'text' },
      { id: 'vehicle_number', label: 'Vehicle Number', type: 'text' },
    ],
  },
  professional: {
    category: 'professional',
    steps: [
      { id: 'package', type: 'package', label: 'Choose Package', required: true },
      { id: 'date', type: 'date', label: 'Event Date', required: true },
      { id: 'duration', type: 'duration', label: 'Event Duration', required: true },
      { id: 'location', type: 'location', label: 'Event Location', required: true },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    staffRequired: false,
    customFields: [
      { id: 'event_location', label: 'Event Location', type: 'text' },
    ],
  },
  education: {
    category: 'education',
    steps: [
      { id: 'subject', type: 'subject', label: 'Choose Subject', required: true },
      { id: 'staff', type: 'staff', label: 'Choose Tutor', required: true },
      { id: 'date', type: 'date', label: 'Choose Date', required: true },
      { id: 'time', type: 'time', label: 'Choose Time', required: true },
      { id: 'customer', type: 'customer_info', label: 'Student Details', required: true },
    ],
    staffRequired: true,
    customFields: [
      { id: 'student_name', label: 'Student Name', type: 'text' },
      { id: 'recurring', label: 'Recurring Schedule', type: 'select', options: ['One-time', 'Weekly', 'Bi-weekly'] },
    ],
  },
  sports: {
    category: 'sports',
    steps: [
      { id: 'service', type: 'service', label: 'Choose Sport', required: true },
      { id: 'court', type: 'court', label: 'Choose Court', required: true },
      { id: 'players', type: 'players', label: 'Number of Players', required: true },
      { id: 'date', type: 'date', label: 'Choose Date', required: true },
      { id: 'time', type: 'time', label: 'Choose Time', required: true },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    staffRequired: false,
    customFields: [
      { id: 'players', label: 'Number of Players', type: 'number' },
    ],
  },
  fitness: {
    category: 'fitness',
    steps: [
      { id: 'service', type: 'service', label: 'Choose Session', required: true },
      { id: 'staff', type: 'staff', label: 'Choose Trainer', required: false },
      { id: 'date', type: 'date', label: 'Choose Date', required: true },
      { id: 'time', type: 'time', label: 'Choose Time', required: true },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    staffRequired: false,
  },
  home: {
    category: 'home',
    steps: [
      { id: 'service', type: 'service', label: 'Choose Service', required: true },
      { id: 'date', type: 'date', label: 'Choose Date', required: true },
      { id: 'time', type: 'time', label: 'Choose Time', required: true },
      { id: 'location', type: 'location', label: 'Service Address', required: true },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    staffRequired: false,
    customFields: [
      { id: 'address', label: 'Service Address', type: 'text' },
    ],
  },
  legal: {
    category: 'legal',
    steps: [
      { id: 'service', type: 'service', label: 'Choose Service', required: true },
      { id: 'staff', type: 'staff', label: 'Choose Lawyer', required: false },
      { id: 'date', type: 'date', label: 'Choose Date', required: true },
      { id: 'time', type: 'time', label: 'Choose Time', required: true },
      { id: 'customer', type: 'customer_info', label: 'Your Details', required: true },
    ],
    staffRequired: false,
  },
};

const CATEGORY_RULES: Array<{ id: string; pattern: RegExp }> = [
  { id: 'legal', pattern: /\b(lawyer|lawyers|legal|advocate|attorney|litigation|notary|law\s*firm|counsel|solicitor)\b/ },
  { id: 'beauty', pattern: /\b(salon|saloon|beauty|parlour|parlor|barber|haircut|hair\s*cut|hair\s*spa|facial|makeup|manicure|pedicure)\b/ },
  { id: 'health', pattern: /\b(doctor|clinic|dental|dentist|hospital|medical|health|physician)\b/ },
  { id: 'auto', pattern: /\b(car|auto|vehicle|garage|mechanic|workshop)\b/ },
  { id: 'professional', pattern: /\b(photo|photograph|photographer|wedding|event\s*planner)\b/ },
  { id: 'education', pattern: /\b(tutor|tuition|teach|teacher|class|education|coaching|academy)\b/ },
  { id: 'sports', pattern: /\b(sport|court|badminton|tennis|cricket|arena)\b/ },
  { id: 'fitness', pattern: /\b(fitness|yoga|trainer|workout|gym)\b/ },
  { id: 'home', pattern: /\b(plumb|plumber|electric|electrician|clean(?:ing)?|repair|home\s*service)\b/ },
];

/** Words the owner might negate when correcting a wrong guess ("it is not beauty"). */
const CATEGORY_NOUNS = CATEGORY_RULES.map((r) => r.id).concat([
  'salon',
  'saloon',
  'beauty',
  'lawyer',
  'legal',
  'clinic',
  'hospital',
  'garage',
  'tutor',
  'sports',
  'fitness',
  'gym',
]);

export function stripNegatedCategoryPhrases(text: string): string {
  const nouns = CATEGORY_NOUNS.join('|');
  return text.replace(new RegExp(`\\b(?:not|n't|isnt|isn't)\\s+(?:a\\s+|an\\s+)?(?:${nouns})\\b`, 'gi'), ' ');
}

export function inferCategory(text: string): string | undefined {
  const lower = stripNegatedCategoryPhrases(text).toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(lower)) return rule.id;
  }
  return undefined;
}

export function getBookingSchema(category: string): BusinessBookingSchema {
  const key = category.toLowerCase();
  return CATEGORY_SCHEMAS[key] || CATEGORY_SCHEMAS.beauty;
}

export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    beauty: 'Beauty & Salon',
    health: 'Health & Wellness',
    auto: 'Auto Service',
    professional: 'Professional Services',
    legal: 'Legal / Professional',
    education: 'Education & Tutoring',
    sports: 'Sports & Recreation',
    fitness: 'Fitness',
    home: 'Home Services',
    salon: 'Salon',
  };
  return names[category.toLowerCase()] || category;
}
