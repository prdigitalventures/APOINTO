'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { reportEmailResponse, useEmailNotice } from '@/components/admin/EmailNotice';
import { AreaLineChart, DonutChart, GroupedBarChart, Sparkline } from '@/components/admin/DashboardCharts';

type Range = '1d' | '2d' | '7d' | '30d';

type SeriesPoint = {
  date: string;
  label: string;
  owners: number;
  customers: number;
  businesses: number;
  live: number;
  bookings: number;
};

type Stats = {
  range: Range;
  totals: {
    owners: number;
    customers: number;
    liveBusinesses: number;
    businesses: number;
    disabledBusinesses: number;
    disabledUsers: number;
    staff: number;
  };
  period: {
    ownersJoined: number;
    customersJoined: number;
    businessesCreated: number;
    liveCreated: number;
    bookingsInRange: number;
  };
  series: SeriesPoint[];
  email?: { configured: boolean; from: string };
};

const RANGES: Array<{ id: Range; label: string }> = [
  { id: '1d', label: 'Today' },
  { id: '2d', label: '2 days' },
  { id: '7d', label: 'Weekly' },
  { id: '30d', label: 'Monthly' },
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
  value: number;
  hint: string;
  values: number[];
  tone: 'gradient-emerald' | 'gradient-amber' | 'violet' | 'sky' | 'indigo';
}) {
  const spark =
    tone === 'gradient-emerald' || tone === 'gradient-amber' ? '#ffffff' : undefined;
  const sparkColor =
    spark || (tone === 'violet' ? '#8b5cf6' : tone === 'sky' ? '#0ea5e9' : '#6366f1');

  const wrap =
    tone === 'gradient-emerald'
      ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-700 text-white border-0 shadow-[0_10px_28px_rgba(16,185,129,0.28)]'
      : tone === 'gradient-amber'
        ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white border-0 shadow-[0_10px_28px_rgba(245,158,11,0.28)]'
        : CARD;

  const muted =
    tone === 'gradient-emerald' || tone === 'gradient-amber'
      ? 'text-white/80'
      : 'text-gray-500 dark:text-gray-400';

  return (
    <Link href={href} className={`${wrap} flex flex-col p-4 transition hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-xs font-medium ${muted}`}>{label}</p>
        <Sparkline values={values} color={sparkColor} className="h-7 w-16 shrink-0 opacity-90" />
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className={`mt-1 text-xs ${muted}`}>{hint}</p>
    </Link>
  );
}

export default function AdminHomePage() {
  const [range, setRange] = useState<Range>('1d');
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const { showEmailResult } = useEmailNotice();

  useEffect(() => {
    setStats(null);
    fetch(`/api/admin/stats?range=${range}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Could not load');
        setStats(data);
      })
      .catch((e) => setError((e as Error).message));
  }, [range]);

  if (error) return <p className="text-red-600">{error}</p>;

  const labels = stats?.series.map((p) => p.label) ?? [];
  const ownersSeries = stats?.series.map((p) => p.owners) ?? [];
  const customersSeries = stats?.series.map((p) => p.customers) ?? [];
  const bookingsSeries = stats?.series.map((p) => p.bookings) ?? [];
  const shopsSeries = stats?.series.map((p) => p.businesses) ?? [];
  const liveSpark = stats?.series.map((p) => p.live) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Overview</p>
          <h1 className="text-2xl font-bold tracking-tight">Home</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Live shops, signups, and bookings for the selected window.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-gray-200 bg-white p-0.5 text-xs shadow-sm dark:border-gray-700 dark:bg-[#16181d]">
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

      {stats ? (
        <div className={`${CARD} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}>
          <div className="text-sm">
            {stats.email?.configured ? (
              <p className="text-gray-600 dark:text-gray-300">
                Email is linked{stats.email.from ? ` · ${stats.email.from}` : ''}.
              </p>
            ) : (
              <p className="text-amber-800 dark:text-amber-200">
                Email is not linked. Add <code className="font-mono text-xs">RESEND_API_KEY</code> and{' '}
                <code className="font-mono text-xs">EMAIL_FROM=Apointo &lt;noreply@apointo.online&gt;</code> on Railway.
              </p>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const res = await fetch('/api/admin/email-test', { method: 'POST' });
              const data = await res.json();
              await reportEmailResponse(res, data, showEmailResult, 'Email sent successfully');
            }}
          >
            Send test email
          </Button>
        </div>
      ) : null}

      {!stats ? (
        <p className="text-sm text-gray-500">Loading analytics...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              href="/admin/businesses?status=active"
              label="Live shops"
              value={stats.totals.liveBusinesses}
              hint={`${stats.totals.businesses} shops total`}
              values={liveSpark}
              tone="gradient-emerald"
            />
            <KpiCard
              href="/admin/accounts?role=OWNER"
              label="Owners joined"
              value={stats.period.ownersJoined}
              hint="New owners in window"
              values={ownersSeries}
              tone="violet"
            />
            <KpiCard
              href="/admin/accounts?role=CUSTOMER"
              label="Customers joined"
              value={stats.period.customersJoined}
              hint="New customers in window"
              values={customersSeries}
              tone="sky"
            />
            <KpiCard
              href="/admin"
              label="Bookings"
              value={stats.period.bookingsInRange}
              hint="Created in window"
              values={bookingsSeries}
              tone="gradient-amber"
            />
            <KpiCard
              href="/admin/businesses"
              label="Shops created"
              value={stats.period.businessesCreated}
              hint={`${stats.period.liveCreated} went live`}
              values={shopsSeries}
              tone="indigo"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className={`${CARD} p-5 lg:col-span-2`}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold">Signups</h2>
                  <p className="text-xs text-gray-500">Owners vs customers joined</p>
                </div>
                <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-300">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-violet-500" /> Owners
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-500" /> Customers
                  </span>
                </div>
              </div>
              <GroupedBarChart
                labels={labels}
                series={[
                  { label: 'Owners', color: '#8b5cf6', values: ownersSeries },
                  { label: 'Customers', color: '#0ea5e9', values: customersSeries },
                ]}
              />
            </section>

            <section className={`${CARD} p-5`}>
              <h2 className="font-semibold">Shop status</h2>
              <p className="mb-3 text-xs text-gray-500">Live vs not live</p>
              <DonutChart
                centerLabel="live"
                centerValue={stats.totals.liveBusinesses}
                segments={[
                  { label: 'Live', value: stats.totals.liveBusinesses, color: '#10b981' },
                  { label: 'Not live', value: stats.totals.disabledBusinesses, color: '#f43f5e' },
                ]}
              />
              <p className="mt-3 text-center text-xs text-gray-500">
                {stats.totals.owners} owners · {stats.totals.customers} customers
              </p>
            </section>
          </div>

          <section className={`${CARD} p-5`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">Activity</h2>
                <p className="text-xs text-gray-500">Bookings and shops created over the window</p>
              </div>
              <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-300">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Bookings
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" /> Shops created
                </span>
              </div>
            </div>
            <AreaLineChart
              labels={labels}
              series={[
                { label: 'Bookings', color: '#f59e0b', values: bookingsSeries },
                { label: 'Shops', color: '#6366f1', values: shopsSeries },
              ]}
            />
          </section>
        </>
      )}
    </div>
  );
}
