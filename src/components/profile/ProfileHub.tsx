'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  ChevronRight,
  CircleHelp,
  Coins,
  FileText,
  Gift,
  Info,
  LifeBuoy,
  LogOut,
  MessageSquareHeart,
  Moon,
  Settings,
  Shield,
  Sun,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/Button';

interface Item {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
}

function Group({ title, items }: { title: string; items: Item[] }) {
  return (
    <section>
      <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-[#16181d]">
        {items.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 p-4 ${i ? 'border-t border-gray-100 dark:border-gray-800' : ''}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <item.icon size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">{item.hint}</span>
            </span>
            <ChevronRight size={16} className="text-gray-400" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ProfileHub({ expectedRole }: { expectedRole: 'OWNER' | 'CUSTOMER' }) {
  const { user, loading, logout, refresh } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const base = expectedRole === 'OWNER' ? '/owner/profile' : '/customer/profile';

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== expectedRole) {
      router.push(user.role === 'OWNER' ? '/owner' : '/customer');
    }
  }, [expectedRole, loading, router, user]);

  useEffect(() => {
    if (!loading && user?.id) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id]);

  if (loading || !user || user.role !== expectedRole) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const signOut = async () => {
    await logout();
    router.push('/');
  };

  const account: Item[] = [
    { href: `${base}/account`, label: 'Account', hint: 'Name, photo, phone, email', icon: UserRound },
  ];
  if (expectedRole === 'OWNER') {
    account.push({
      href: `${base}/business`,
      label: 'Business details',
      hint: 'Listing, QR sticker, Google Book button',
      icon: Building2,
    });
  }

  const app: Item[] = [
    { href: `${base}/settings`, label: 'Settings', hint: 'Notifications and appearance', icon: Settings },
    { href: `${base}/about`, label: 'About us', hint: 'Who we are and the free basic plan', icon: Info },
    { href: `${base}/how-to`, label: 'How to use', hint: 'HTU — walkthrough for this app', icon: CircleHelp },
    { href: `${base}/faqs`, label: 'FAQs', hint: 'Asked by owners and customers', icon: LifeBuoy },
    { href: `${base}/feedback`, label: 'Share feedback', hint: 'Help us improve the app', icon: MessageSquareHeart },
  ];

  const grow: Item[] = [
    { href: `${base}/refer`, label: 'Refer', hint: 'Invite a friend with your code', icon: Gift },
    { href: `${base}/rewards`, label: 'Coins & rewards', hint: `${user.rewardPoints ?? 0} coins`, icon: Coins },
  ];

  const legal: Item[] = [
    { href: `${base}/privacy`, label: 'Privacy', hint: 'How we use account data', icon: Shield },
    { href: `${base}/terms`, label: 'Terms', hint: 'Using Apointo.online', icon: FileText },
  ];

  return (
    <div className="min-h-screen pb-24">
      <header className="border-b border-gray-100 bg-white px-4 py-4 dark:border-gray-800 dark:bg-[#16181d]">
        <div className="mx-auto max-w-lg">
          <h1 className="font-semibold">Profile</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Account settings</p>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-5 p-4">
        <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/60">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 overflow-hidden rounded-2xl bg-indigo-600 text-white">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <UserRound size={26} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold">{user.name}</h2>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                {expectedRole === 'OWNER' ? 'Business owner' : 'Customer'}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-700 dark:bg-[#16181d] dark:text-indigo-200"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </section>

        <Group title="Your details" items={account} />
        <Group title="App" items={app} />
        <Group title="Earn" items={grow} />
        <Group title="Legal" items={legal} />

        <a
          href="mailto:apointosupport@pozer.co.in"
          className="block rounded-2xl border border-gray-100 bg-white p-4 text-sm dark:border-gray-800 dark:bg-[#16181d]"
        >
          Help & support
          <span className="mt-1 block text-xs text-indigo-600">apointosupport@pozer.co.in</span>
        </a>

        <Button variant="outline" className="w-full" onClick={signOut}>
          <LogOut size={17} className="mr-2" />
          Sign out
        </Button>
      </main>
    </div>
  );
}
