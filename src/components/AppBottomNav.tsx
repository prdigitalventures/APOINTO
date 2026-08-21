'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  CalendarDays,
  Home,
  UserRound,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

function BottomNav({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-indigo-100 bg-white/95 shadow-[0_-4px_16px_rgba(79,70,229,0.06)] backdrop-blur safe-bottom dark:border-gray-800 dark:bg-[#16181d]/95"
    >
      <div className="mx-auto flex max-w-lg px-1 py-1.5">
        {items.map(({ href, label: itemLabel, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center rounded-xl px-1 py-1.5 transition-colors ${
                active
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200'
                  : 'text-gray-500 hover:bg-violet-50 hover:text-violet-700 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className="mt-1 truncate text-[11px] font-medium">{itemLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const customerItems: NavItem[] = [
  { href: '/customer', label: 'Home', icon: Home, exact: true },
  { href: '/customer/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/customer/alerts', label: 'Alerts', icon: Bell },
  { href: '/customer/profile', label: 'Profile', icon: UserRound },
];

const ownerItems: NavItem[] = [
  { href: '/owner', label: 'Home', icon: Home, exact: true },
  { href: '/owner/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/owner/notifications', label: 'Alerts', icon: Bell },
  { href: '/owner/crm', label: 'CRM', icon: UsersRound },
  { href: '/owner/profile', label: 'Profile', icon: UserRound },
];

export function CustomerBottomNav() {
  return <BottomNav items={customerItems} label="Customer navigation" />;
}

export function OwnerBottomNav() {
  return <BottomNav items={ownerItems} label="Owner navigation" />;
}
