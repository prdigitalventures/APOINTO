import type { LucideIcon } from 'lucide-react';
import {
  AlarmClock,
  Ban,
  Bell,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  CircleCheck,
  Clock,
  Hourglass,
  ThumbsDown,
  ThumbsUp,
  Timer,
  UserRound,
  XCircle,
} from 'lucide-react';
import type { NotificationType } from '@/lib/notifications';

export type AlertVisualKey =
  | 'upcoming'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'time_suggested'
  | 'rescheduled'
  | 'new_request'
  | 'reminder'
  | 'time_update'
  | 'time_accepted'
  | 'time_rejected'
  | 'customer_late'
  | 'business_late'
  | 'generic';

export interface AlertVisual {
  key: AlertVisualKey;
  label: string;
  icon: LucideIcon;
  bar: string;
  iconWrap: string;
  unreadCard: string;
  readCard: string;
  badge: string;
  title: string;
}

const visuals: Record<AlertVisualKey, AlertVisual> = {
  upcoming: {
    key: 'upcoming',
    label: 'Upcoming',
    icon: CheckCircle2,
    bar: 'bg-emerald-500',
    iconWrap: 'bg-emerald-500 text-white shadow-emerald-200/80 dark:shadow-none',
    unreadCard:
      'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/55 dark:border-emerald-800',
    readCard:
      'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/25 dark:border-emerald-900/60',
    badge: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
    title: 'text-emerald-950 dark:text-emerald-50',
  },
  completed: {
    key: 'completed',
    label: 'Completed',
    icon: CircleCheck,
    bar: 'bg-teal-600',
    iconWrap: 'bg-teal-600 text-white',
    unreadCard: 'bg-teal-50 border-teal-200 dark:bg-teal-950/50 dark:border-teal-800',
    readCard:
      'bg-teal-50/50 border-teal-100 dark:bg-teal-950/20 dark:border-teal-900/50',
    badge: 'bg-teal-600/15 text-teal-800 dark:text-teal-200',
    title: 'text-teal-950 dark:text-teal-50',
  },
  cancelled: {
    key: 'cancelled',
    label: 'Cancelled',
    icon: XCircle,
    bar: 'bg-red-500',
    iconWrap: 'bg-red-500 text-white',
    unreadCard: 'bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800',
    readCard: 'bg-red-50/50 border-red-100 dark:bg-red-950/20 dark:border-red-900/50',
    badge: 'bg-red-500/15 text-red-800 dark:text-red-200',
    title: 'text-red-950 dark:text-red-50',
  },
  rejected: {
    key: 'rejected',
    label: 'Declined',
    icon: Ban,
    bar: 'bg-rose-600',
    iconWrap: 'bg-rose-600 text-white',
    unreadCard: 'bg-rose-50 border-rose-200 dark:bg-rose-950/50 dark:border-rose-800',
    readCard: 'bg-rose-50/45 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50',
    badge: 'bg-rose-600/15 text-rose-800 dark:text-rose-200',
    title: 'text-rose-950 dark:text-rose-50',
  },
  time_suggested: {
    key: 'time_suggested',
    label: 'New time',
    icon: CalendarClock,
    bar: 'bg-amber-500',
    iconWrap: 'bg-amber-500 text-white',
    unreadCard: 'bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800',
    readCard:
      'bg-amber-50/50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/50',
    badge: 'bg-amber-500/15 text-amber-900 dark:text-amber-200',
    title: 'text-amber-950 dark:text-amber-50',
  },
  rescheduled: {
    key: 'rescheduled',
    label: 'Rescheduled',
    icon: CalendarCheck,
    bar: 'bg-orange-500',
    iconWrap: 'bg-orange-500 text-white',
    unreadCard:
      'bg-orange-50 border-orange-200 dark:bg-orange-950/50 dark:border-orange-800',
    readCard:
      'bg-orange-50/50 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/50',
    badge: 'bg-orange-500/15 text-orange-900 dark:text-orange-200',
    title: 'text-orange-950 dark:text-orange-50',
  },
  new_request: {
    key: 'new_request',
    label: 'Request',
    icon: Bell,
    bar: 'bg-indigo-500',
    iconWrap: 'bg-indigo-500 text-white',
    unreadCard:
      'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/55 dark:border-indigo-800',
    readCard:
      'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-950/25 dark:border-indigo-900/60',
    badge: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-200',
    title: 'text-indigo-950 dark:text-indigo-50',
  },
  reminder: {
    key: 'reminder',
    label: 'Reminder',
    icon: AlarmClock,
    bar: 'bg-violet-500',
    iconWrap: 'bg-violet-500 text-white',
    unreadCard:
      'bg-violet-50 border-violet-200 dark:bg-violet-950/50 dark:border-violet-800',
    readCard:
      'bg-violet-50/50 border-violet-100 dark:bg-violet-950/20 dark:border-violet-900/50',
    badge: 'bg-violet-500/15 text-violet-800 dark:text-violet-200',
    title: 'text-violet-950 dark:text-violet-50',
  },
  time_update: {
    key: 'time_update',
    label: 'Time update',
    icon: Clock,
    bar: 'bg-sky-500',
    iconWrap: 'bg-sky-500 text-white',
    unreadCard: 'bg-sky-50 border-sky-200 dark:bg-sky-950/50 dark:border-sky-800',
    readCard: 'bg-sky-50/50 border-sky-100 dark:bg-sky-950/20 dark:border-sky-900/50',
    badge: 'bg-sky-500/15 text-sky-800 dark:text-sky-200',
    title: 'text-sky-950 dark:text-sky-50',
  },
  time_accepted: {
    key: 'time_accepted',
    label: 'Time accepted',
    icon: ThumbsUp,
    bar: 'bg-cyan-600',
    iconWrap: 'bg-cyan-600 text-white',
    unreadCard: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/50 dark:border-cyan-800',
    readCard: 'bg-cyan-50/50 border-cyan-100 dark:bg-cyan-950/20 dark:border-cyan-900/50',
    badge: 'bg-cyan-600/15 text-cyan-800 dark:text-cyan-200',
    title: 'text-cyan-950 dark:text-cyan-50',
  },
  time_rejected: {
    key: 'time_rejected',
    label: 'Time declined',
    icon: ThumbsDown,
    bar: 'bg-pink-500',
    iconWrap: 'bg-pink-500 text-white',
    unreadCard: 'bg-pink-50 border-pink-200 dark:bg-pink-950/50 dark:border-pink-800',
    readCard: 'bg-pink-50/50 border-pink-100 dark:bg-pink-950/20 dark:border-pink-900/50',
    badge: 'bg-pink-500/15 text-pink-800 dark:text-pink-200',
    title: 'text-pink-950 dark:text-pink-50',
  },
  customer_late: {
    key: 'customer_late',
    label: 'Running late',
    icon: UserRound,
    bar: 'bg-yellow-400',
    iconWrap: 'bg-yellow-400 text-yellow-950',
    unreadCard:
      'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/45 dark:border-yellow-800',
    readCard:
      'bg-yellow-50/50 border-yellow-100 dark:bg-yellow-950/20 dark:border-yellow-900/50',
    badge: 'bg-yellow-400/25 text-yellow-900 dark:text-yellow-200',
    title: 'text-yellow-950 dark:text-yellow-50',
  },
  business_late: {
    key: 'business_late',
    label: 'Delayed',
    icon: Hourglass,
    bar: 'bg-fuchsia-500',
    iconWrap: 'bg-fuchsia-500 text-white',
    unreadCard:
      'bg-fuchsia-50 border-fuchsia-200 dark:bg-fuchsia-950/50 dark:border-fuchsia-800',
    readCard:
      'bg-fuchsia-50/50 border-fuchsia-100 dark:bg-fuchsia-950/20 dark:border-fuchsia-900/50',
    badge: 'bg-fuchsia-500/15 text-fuchsia-800 dark:text-fuchsia-200',
    title: 'text-fuchsia-950 dark:text-fuchsia-50',
  },
  generic: {
    key: 'generic',
    label: 'Alert',
    icon: Timer,
    bar: 'bg-slate-500',
    iconWrap: 'bg-slate-500 text-white',
    unreadCard: 'bg-slate-100 border-slate-200 dark:bg-slate-800/70 dark:border-slate-600',
    readCard: 'bg-white border-slate-200 dark:bg-[#16181d] dark:border-slate-700',
    badge: 'bg-slate-500/15 text-slate-700 dark:text-slate-200',
    title: 'text-slate-900 dark:text-slate-50',
  },
};

const typeToKey: Record<NotificationType, AlertVisualKey> = {
  NEW_BOOKING_REQUEST: 'new_request',
  BOOKING_ACCEPTED: 'upcoming',
  BOOKING_COMPLETED: 'completed',
  BOOKING_REJECTED: 'rejected',
  ALTERNATIVE_TIME_SUGGESTED: 'time_suggested',
  TIME_UPDATE_REQUESTED: 'time_update',
  CUSTOMER_RUNNING_LATE: 'customer_late',
  BUSINESS_RUNNING_LATE: 'business_late',
  BOOKING_CANCELLED: 'cancelled',
  BOOKING_RESCHEDULED: 'rescheduled',
  APPOINTMENT_REMINDER: 'reminder',
  TIME_REQUEST_ACCEPTED: 'time_accepted',
  TIME_REQUEST_REJECTED: 'time_rejected',
};

function inferKeyFromText(text: string): AlertVisualKey | null {
  const t = text.toLowerCase();
  if (/\bcomplet(ed|e)|done\b/.test(t)) return 'completed';
  if (/\bcancel/.test(t)) return 'cancelled';
  if (/\breject|declin|not available/.test(t)) return 'rejected';
  if (/alternative time|suggested/.test(t)) return 'time_suggested';
  if (/reschedul/.test(t)) return 'rescheduled';
  if (/new booking request|booking request/.test(t)) return 'new_request';
  if (/remind/.test(t)) return 'reminder';
  if (/time request accepted|time accepted/.test(t)) return 'time_accepted';
  if (/time request reject|time declined/.test(t)) return 'time_rejected';
  if (/customer.*late|running late/.test(t) && /customer/.test(t)) return 'customer_late';
  if (/running late|delayed|appointment update/.test(t)) return 'business_late';
  if (/time update/.test(t)) return 'time_update';
  if (/confirmed|upcoming|appointment/.test(t)) return 'upcoming';
  return null;
}

export function resolveAlertVisual(type?: string | null, title?: string, message?: string): AlertVisual {
  if (type && type in typeToKey) {
    return visuals[typeToKey[type as NotificationType]];
  }
  const inferred = inferKeyFromText(`${title || ''} ${message || ''}`);
  return visuals[inferred || 'generic'];
}

export const ALERT_COLOR_MAP = Object.fromEntries(
  (Object.keys(typeToKey) as NotificationType[]).map((type) => {
    const visual = visuals[typeToKey[type]];
    return [type, { label: visual.label, key: visual.key, bar: visual.bar }];
  })
) as Record<NotificationType, { label: string; key: AlertVisualKey; bar: string }>;
