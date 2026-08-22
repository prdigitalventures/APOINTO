'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  Globe,
  Home,
  LifeBuoy,
  Receipt,
  Settings,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';

type Tone =
  | 'indigo'
  | 'sky'
  | 'amber'
  | 'violet'
  | 'fuchsia'
  | 'teal'
  | 'blue'
  | 'orange'
  | 'emerald'
  | 'rose'
  | 'cyan'
  | 'slate';

interface Tool {
  href: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
}

const TONE: Record<Tone, string> = {
  indigo:
    'from-[#7c8cff] via-[#4f46e5] to-[#312e81] shadow-[0_10px_18px_rgba(79,70,229,0.35)]',
  sky: 'from-[#7dd3fc] via-[#0ea5e9] to-[#0369a1] shadow-[0_10px_18px_rgba(14,165,233,0.35)]',
  amber:
    'from-[#fcd34d] via-[#f59e0b] to-[#c2410c] shadow-[0_10px_18px_rgba(245,158,11,0.35)]',
  violet:
    'from-[#d8b4fe] via-[#8b5cf6] to-[#5b21b6] shadow-[0_10px_18px_rgba(139,92,246,0.35)]',
  fuchsia:
    'from-[#f0abfc] via-[#d946ef] to-[#86198f] shadow-[0_10px_18px_rgba(217,70,239,0.32)]',
  teal: 'from-[#5eead4] via-[#14b8a6] to-[#0f766e] shadow-[0_10px_18px_rgba(20,184,166,0.35)]',
  blue: 'from-[#93c5fd] via-[#3b82f6] to-[#1d4ed8] shadow-[0_10px_18px_rgba(59,130,246,0.35)]',
  orange:
    'from-[#fdba74] via-[#f97316] to-[#c2410c] shadow-[0_10px_18px_rgba(249,115,22,0.35)]',
  emerald:
    'from-[#6ee7b7] via-[#10b981] to-[#047857] shadow-[0_10px_18px_rgba(16,185,129,0.35)]',
  rose: 'from-[#fda4af] via-[#f43f5e] to-[#9f1239] shadow-[0_10px_18px_rgba(244,63,94,0.32)]',
  cyan: 'from-[#67e8f9] via-[#06b6d4] to-[#0e7490] shadow-[0_10px_18px_rgba(6,182,212,0.32)]',
  slate:
    'from-[#cbd5e1] via-[#64748b] to-[#334155] shadow-[0_10px_18px_rgba(100,116,139,0.32)]',
};

export function ownerTools(slug?: string | null): Tool[] {
  const items: Tool[] = [
    { href: '/owner', label: 'Home', icon: Home, tone: 'indigo' },
    { href: '/owner/calendar', label: 'Calendar', icon: CalendarDays, tone: 'sky' },
    { href: '/owner/leads', label: 'Leads', icon: Sparkles, tone: 'amber' },
    { href: '/owner/bookings', label: 'Bookings', icon: ClipboardList, tone: 'violet' },
    { href: '/owner/services', label: 'Services', icon: Briefcase, tone: 'fuchsia' },
    { href: '/owner/crm', label: 'Customers', icon: Users, tone: 'teal' },
    { href: '/owner/staff', label: 'Staff', icon: UserRound, tone: 'blue' },
    { href: '/owner/profile/business', label: 'Shops', icon: Building2, tone: 'orange' },
    { href: '/owner/receipts', label: 'Invoices', icon: Receipt, tone: 'emerald' },
    { href: '/owner/notifications', label: 'Alerts', icon: Bell, tone: 'rose' },
    { href: '/owner/profile/faqs', label: 'Help', icon: LifeBuoy, tone: 'cyan' },
    { href: '/owner/profile/settings', label: 'Settings', icon: Settings, tone: 'slate' },
  ];
  if (slug) {
    items.splice(8, 0, {
      href: `/${slug}`,
      label: 'Listing',
      icon: Globe,
      tone: 'indigo',
    });
  }
  return items;
}

export function OwnerToolGrid({ slug }: { slug?: string | null }) {
  const tools = ownerTools(slug);
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Tools</p>
          <h2 className="text-lg font-bold tracking-tight lg:text-xl">Your shop</h2>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-x-3 gap-y-5 sm:grid-cols-6 lg:grid-cols-8 lg:gap-x-5">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={`${tool.href}-${tool.label}`} href={tool.href} className="group flex flex-col items-center">
              <span
                className={`relative flex h-14 w-14 items-center justify-center rounded-[1.15rem] bg-gradient-to-br text-white transition duration-200 group-hover:-translate-y-0.5 group-active:translate-y-0 lg:h-[4.25rem] lg:w-[4.25rem] lg:rounded-[1.35rem] ${TONE[tool.tone]}`}
              >
                <span className="pointer-events-none absolute inset-px rounded-[1.05rem] bg-gradient-to-b from-white/35 to-transparent lg:rounded-[1.25rem]" />
                <span className="pointer-events-none absolute inset-x-2 bottom-1 h-2 rounded-full bg-black/20 blur-[3px]" />
                <Icon size={22} className="relative drop-shadow-sm lg:h-6 lg:w-6" strokeWidth={2.2} />
              </span>
              <span className="mt-1.5 max-w-[4.8rem] text-center text-[11px] font-medium leading-tight text-gray-700 dark:text-gray-300 lg:max-w-none lg:text-xs">
                {tool.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
