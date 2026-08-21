'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  CalendarDays,
  ChevronsUpDown,
  Home,
  UserRound,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useActiveBusiness } from './ActiveBusinessProvider';

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
      className="border-t border-indigo-100 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-[#16181d]/95"
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
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 safe-bottom">
      <BottomNav items={customerItems} label="Customer navigation" />
    </div>
  );
}

export function OwnerBottomNav() {
  const { businesses, active, setActiveId } = useActiveBusiness();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 safe-bottom">
      {businesses.length > 1 ? (
        <div className="border-t border-indigo-100 bg-white/95 px-3 py-1.5 dark:border-gray-800 dark:bg-[#16181d]/95">
          <div className="relative mx-auto max-w-lg">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg bg-indigo-50 px-3 py-1.5 text-left text-xs font-medium text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200"
            >
              <span className="truncate">Switch business: {active?.name || 'Select'}</span>
              <ChevronsUpDown size={14} />
            </button>
            {open ? (
              <div className="absolute bottom-full left-0 right-0 mb-1 max-h-56 overflow-auto rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-[#16181d]">
                {businesses.map((biz) => (
                  <button
                    key={biz.id}
                    type="button"
                    onClick={() => {
                      setActiveId(biz.id);
                      setOpen(false);
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm ${
                      biz.id === active?.id ? 'bg-indigo-50 font-medium dark:bg-indigo-950' : ''
                    }`}
                  >
                    {biz.name}
                    <span className="ml-2 text-xs capitalize text-gray-500">{biz.category}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <BottomNav items={ownerItems} label="Owner navigation" />
    </div>
  );
}
