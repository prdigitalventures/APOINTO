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
};

export function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/salon|hair|beauty|spa|facial|barber|nail|makeup/.test(lower)) return 'beauty';
  if (/doctor|clinic|dental|hospital|medical|health/.test(lower)) return 'health';
  if (/car|auto|vehicle|garage|mechanic/.test(lower)) return 'auto';
  if (/photo|photograph|wedding|event/.test(lower)) return 'professional';
  if (/tutor|teach|class|education|coaching/.test(lower)) return 'education';
  if (/sport|court|badminton|tennis|cricket|gym|arena/.test(lower)) return 'sports';
  if (/fitness|yoga|trainer|workout/.test(lower)) return 'fitness';
  if (/plumb|electric|clean|repair|home/.test(lower)) return 'home';
  return 'beauty';
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
    education: 'Education & Tutoring',
    sports: 'Sports & Recreation',
    fitness: 'Fitness',
    home: 'Home Services',
    salon: 'Salon',
  };
  return names[category.toLowerCase()] || category;
}
