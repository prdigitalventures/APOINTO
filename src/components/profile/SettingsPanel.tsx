'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import { ProfileSubpage, MenuCard } from '@/components/profile/ProfileSubpage';

const KEYS = {
  bookings: 'apointo-notify-bookings',
  reminders: 'apointo-notify-reminders',
  offers: 'apointo-notify-offers',
};

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 p-4 text-left"
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-gray-500 dark:text-gray-400">{hint}</span>
      </span>
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'left-5' : 'left-0.5'}`}
        />
      </span>
    </button>
  );
}

export function SettingsPanel({ role }: { role: 'OWNER' | 'CUSTOMER' }) {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const base = role === 'OWNER' ? '/owner/profile' : '/customer/profile';
  const [bookings, setBookings] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [offers, setOffers] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== role) router.push(user.role === 'OWNER' ? '/owner' : '/customer');
  }, [loading, role, router, user]);

  useEffect(() => {
    setBookings(window.localStorage.getItem(KEYS.bookings) !== 'off');
    setReminders(window.localStorage.getItem(KEYS.reminders) !== 'off');
    setOffers(window.localStorage.getItem(KEYS.offers) === 'on');
  }, []);

  const persist = (key: string, on: boolean, setter: (v: boolean) => void) => {
    setter(on);
    window.localStorage.setItem(key, on ? 'on' : 'off');
  };

  if (loading || !user || user.role !== role) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <ProfileSubpage title="Settings" subtitle="Alerts, appearance, and preferences" backHref={base}>
      <MenuCard>
        <ToggleRow
          label={role === 'OWNER' ? 'New booking alerts' : 'Booking updates'}
          hint="In-app alerts when a booking is created or changed"
          checked={bookings}
          onChange={(v) => persist(KEYS.bookings, v, setBookings)}
        />
        <div className="border-t border-gray-100 dark:border-gray-800" />
        <ToggleRow
          label="Reminders"
          hint="Heads-up before an appointment"
          checked={reminders}
          onChange={(v) => persist(KEYS.reminders, v, setReminders)}
        />
        <div className="border-t border-gray-100 dark:border-gray-800" />
        <ToggleRow
          label="Tips and offers"
          hint="Product updates. Off by default."
          checked={offers}
          onChange={(v) => persist(KEYS.offers, v, setOffers)}
        />
      </MenuCard>

      <MenuCard>
        <div className="p-4">
          <p className="text-sm font-medium">Appearance</p>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Dark or light mode on this device</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium ${
                theme === 'light'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <Sun size={16} /> Light
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium ${
                theme === 'dark'
                  ? 'border-indigo-400 bg-indigo-950 text-indigo-200'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <Moon size={16} /> Dark
            </button>
          </div>
        </div>
      </MenuCard>
    </ProfileSubpage>
  );
}
