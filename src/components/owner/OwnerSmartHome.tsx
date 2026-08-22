'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, ChevronRight, MapPin } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useActiveBusiness } from '@/components/ActiveBusinessProvider';
import { AIChat } from '@/components/AIChat';
import { QrSticker } from '@/components/QrSticker';
import { Button } from '@/components/ui/Button';
import { AreaLineChart, Sparkline } from '@/components/admin/DashboardCharts';
import { OwnerToolGrid } from '@/components/owner/OwnerToolGrid';
import { formatBusinessCode, googleMapsSearchUrl } from '@/lib/place';
import { getCategoryDisplayName } from '@/lib/booking-schema';
import { formatCurrency } from '@/lib/utils';
import type { OwnerAnalyticsRange } from '@/lib/owner-analytics';

type SeriesPoint = { date: string; label: string; bookings: number; revenue: number };

type Stats = {
  range: OwnerAnalyticsRange;
  totals: {
    bookings: number;
    customers: number;
    revenue: number;
    services: number;
    staff: number;
    shops: number;
    upcoming: number;
    pending: number;
    todayBookings: number;
  };
  period: {
    bookingsInRange: number;
    revenueInRange: number;
  };
  series: SeriesPoint[];
};

const RANGES: Array<{ id: OwnerAnalyticsRange; label: string }> = [
  { id: '1d', label: 'Day' },
  { id: '7d', label: 'Weekly' },
  { id: '30d', label: 'Month' },
];

const CARD =
  'rounded-2xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:border-gray-800 dark:bg-[#16181d] dark:shadow-none';

function KpiCard({
  href,
  label,
  value,
  hint,
  values,
  tone,
}: {
  href: string;
  label: string;
  value: string | number;
  hint: string;
  values: number[];
  tone: 'emerald' | 'amber' | 'violet' | 'sky';
}) {
  const wrap =
    tone === 'emerald'
      ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-700 text-white border-0 shadow-[0_10px_28px_rgba(16,185,129,0.28)]'
      : tone === 'amber'
        ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white border-0 shadow-[0_10px_28px_rgba(245,158,11,0.28)]'
        : CARD;
  const muted = tone === 'emerald' || tone === 'amber' ? 'text-white/80' : 'text-gray-500 dark:text-gray-400';
  const sparkColor =
    tone === 'emerald' || tone === 'amber' ? '#ffffff' : tone === 'violet' ? '#8b5cf6' : '#0ea5e9';

  return (
    <Link href={href} className={`${wrap} flex flex-col p-3.5 transition hover:-translate-y-0.5 lg:p-5`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[11px] font-medium uppercase tracking-wide lg:text-xs ${muted}`}>{label}</p>
        <Sparkline values={values} color={sparkColor} className="h-6 w-14 shrink-0 opacity-90 lg:h-7 lg:w-16" />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight lg:mt-3 lg:text-3xl">{value}</p>
      <p className={`mt-1 text-[11px] lg:text-xs ${muted}`}>{hint}</p>
    </Link>
  );
}

export function OwnerSmartHome() {
  const { user, loading } = useAuth();
  const { businesses, active, setActiveId, refresh, loaded } = useActiveBusiness();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [completedBusiness, setCompletedBusiness] = useState<{ id: string; slug: string; name: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [range, setRange] = useState<OwnerAnalyticsRange>('7d');
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('onboarding') === '1') {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'OWNER') router.push('/customer');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetch('/api/notifications').then((r) => r.json()).then((d) => setUnreadCount(d.unreadCount || 0));
    }
  }, [user, completedBusiness]);

  useEffect(() => {
    if (!user || user.role !== 'OWNER' || !loaded) return;
    const params = new URLSearchParams({ range });
    if (active?.id) params.set('businessId', active.id);
    setStats(null);
    setStatsError('');
    fetch(`/api/owner/stats?${params}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Could not load stats');
        setStats(data);
      })
      .catch((e) => setStatsError((e as Error).message));
  }, [user, active?.id, range, loaded]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;

  if (showOnboarding || completedBusiness) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col pb-32">
        <header className="flex items-center justify-between border-b bg-white p-4 dark:border-gray-800 dark:bg-[#16181d]">
          <h1 className="font-semibold">{completedBusiness ? 'Setup complete' : 'AI Business Builder'}</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowOnboarding(false);
              setCompletedBusiness(null);
              refresh();
            }}
          >
            Close
          </Button>
        </header>
        {completedBusiness ? (
          <div className="space-y-6 p-6">
            <div className="text-center">
              <h2 className="text-xl font-bold">Your booking system is ready</h2>
              <p className="mt-2 text-gray-600">{completedBusiness.name}</p>
            </div>
            <QrSticker slug={completedBusiness.slug} businessName={completedBusiness.name} />
            <Link href={`/owner/calendar?business=${completedBusiness.id}`}>
              <Button className="w-full" size="lg" onClick={() => setActiveId(completedBusiness.id)}>
                Open this shop calendar
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex-1">
            <AIChat
              onComplete={(biz) => {
                setCompletedBusiness(biz);
                setActiveId(biz.id);
              }}
            />
          </div>
        )}
      </div>
    );
  }

  const labels = stats?.series.map((p) => p.label) ?? [];
  const revenueSeries = stats?.series.map((p) => p.revenue) ?? [];
  const bookingSeries = stats?.series.map((p) => p.bookings) ?? [];

  return (
    <div className="min-h-screen pb-32">
      <header className="border-b border-gray-100 bg-white px-4 py-4 dark:border-gray-800 dark:bg-[#16181d] lg:px-8">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">Welcome back{user.name ? `, ${user.name.split(' ')[0]}` : ''}</p>
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Home</h1>
            {active ? (
              <p className="mt-1 text-sm text-gray-500">
                {active.name}
                {stats ? ` · ${stats.totals.todayBookings} today · ${stats.totals.upcoming} upcoming` : ''}
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-500">Create a shop to see live booking analytics.</p>
            )}
          </div>
          <Link href="/owner/notifications" className="relative rounded-xl p-2 hover:bg-gray-50 dark:hover:bg-gray-800">
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:space-y-8 lg:px-8 lg:py-8">
        {active && active.isActive === false ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            This listing is disabled by Apointo{active.disabledReason ? `: ${active.disabledReason}` : ''}. New public
            bookings are paused.
          </div>
        ) : null}

        {statsError ? <p className="text-sm text-red-600">{statsError}</p> : null}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <KpiCard
            href="/owner/bookings"
            label="Total bookings"
            value={stats?.totals.bookings ?? '—'}
            hint={stats ? `${stats.period.bookingsInRange} in this window` : 'Live from this shop'}
            values={bookingSeries}
            tone="emerald"
          />
          <KpiCard
            href="/owner/crm"
            label="Customers"
            value={stats?.totals.customers ?? '—'}
            hint="Unique phones on the books"
            values={bookingSeries}
            tone="violet"
          />
          <KpiCard
            href="/owner/receipts"
            label="Revenue"
            value={stats ? formatCurrency(stats.totals.revenue) : '—'}
            hint={stats ? `${formatCurrency(stats.period.revenueInRange)} paid in window` : 'From marked-paid bookings'}
            values={revenueSeries}
            tone="amber"
          />
          <KpiCard
            href="/owner/services"
            label="Services"
            value={stats?.totals.services ?? '—'}
            hint={
              stats
                ? `${stats.totals.staff} staff · ${stats.totals.shops} shop${stats.totals.shops === 1 ? '' : 's'}`
                : 'From this shop'
            }
            values={bookingSeries}
            tone="sky"
          />
        </div>

        <section className={`${CARD} p-4 lg:p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Analytics</p>
              <h2 className="text-lg font-bold tracking-tight lg:text-xl">Booking revenue</h2>
              <p className="mt-1 text-sm text-gray-500">
                Paid totals by day for the selected shop. Unpaid calendar bookings are not counted.
              </p>
            </div>
            <div className="inline-flex rounded-full border border-gray-200 bg-white p-0.5 text-xs shadow-sm dark:border-gray-700 dark:bg-[#0b0d12]">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRange(r.id)}
                  className={`rounded-full px-3 py-1.5 font-medium transition ${
                    range === r.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          {!stats ? (
            <p className="py-16 text-center text-sm text-gray-500">Loading chart...</p>
          ) : (
            <div className="mt-2 lg:mt-4">
              <AreaLineChart
                labels={labels}
                series={[{ label: 'Revenue', color: '#4f46e5', values: revenueSeries }]}
                className="h-48 w-full lg:h-72"
              />
              <p className="mt-2 text-center text-xs text-gray-500">
                {stats.totals.pending} lead{stats.totals.pending === 1 ? '' : 's'} waiting · {formatCurrency(stats.totals.revenue)} paid all-time
              </p>
            </div>
          )}
        </section>

        <OwnerToolGrid slug={active?.slug} />

        {active ? (
          <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40 lg:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">Active shop</p>
            <h2 className="mt-1 text-lg font-semibold">{active.name}</h2>
            <p className="text-sm capitalize text-indigo-800 dark:text-indigo-200">
              {getCategoryDisplayName(active.category)}
              {active.uniqueCode ? ` · ${formatBusinessCode(active.uniqueCode)}` : ''}
            </p>
            {active.location ? (
              <a
                href={googleMapsSearchUrl(active.location)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-700"
              >
                <MapPin size={14} /> {active.location}
              </a>
            ) : null}
            <div className="mt-3 flex gap-2">
              <Link href={`/owner/calendar?business=${active.id}`} className="flex-1">
                <Button className="w-full" size="sm">
                  Calendar
                </Button>
              </Link>
              <Link href={`/${active.slug}`} className="flex-1">
                <Button variant="outline" className="w-full" size="sm">
                  Public profile
                </Button>
              </Link>
            </div>
            <Link
              href="/owner/profile/business#google-book"
              className="mt-3 block text-sm font-medium text-indigo-700 dark:text-indigo-300"
            >
              Add Book on Google for this shop
            </Link>
          </section>
        ) : null}

        <button
          type="button"
          onClick={() => setShowOnboarding(true)}
          className="w-full rounded-2xl border-2 border-indigo-200 bg-white p-4 text-left hover:border-indigo-400 dark:bg-[#16181d]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-600">
              +
            </div>
            <div className="flex-1">
              <p className="font-medium">Add another booking system</p>
              <p className="text-sm text-gray-500">Salon, spa, clinic, legal — switch between them here</p>
            </div>
            <ChevronRight className="text-gray-400" />
          </div>
        </button>

        {businesses.length > 0 ? (
          <section id="shops">
            <h2 className="mb-3 text-lg font-semibold">Your businesses</h2>
            <p className="mb-3 text-sm text-gray-500">Tap to switch. Home, calendar, and customers follow this shop.</p>
            <div className="grid gap-3 lg:grid-cols-2">
              {businesses.map((biz) => (
                <button
                  key={biz.id}
                  type="button"
                  onClick={() => setActiveId(biz.id)}
                  className={`w-full rounded-2xl border p-4 text-left ${
                    biz.id === active?.id
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                      : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-[#16181d]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold">{biz.name}</h3>
                      <p className="text-sm capitalize text-gray-500">
                        {getCategoryDisplayName(biz.category)} · {biz._count?.bookings || 0} bookings
                      </p>
                      {biz.uniqueCode ? (
                        <p className="mt-1 font-mono text-xs">{formatBusinessCode(biz.uniqueCode)}</p>
                      ) : null}
                      {biz.location ? (
                        <a
                          href={googleMapsSearchUrl(biz.location)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-700"
                        >
                          <MapPin size={12} /> {biz.location}
                        </a>
                      ) : null}
                    </div>
                    {biz.id === active?.id ? (
                      <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] text-white">Active</span>
                    ) : (
                      <span className="text-xs text-indigo-700">Switch</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
