'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { reportEmailResponse, useEmailNotice } from '@/components/admin/EmailNotice';

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

function BarChart({
  series,
  keys,
}: {
  series: SeriesPoint[];
  keys: Array<{ key: keyof SeriesPoint; color: string; label: string }>;
}) {
  const numeric = series.flatMap((p) => keys.map((k) => Number(p[k.key]) || 0));
  const max = Math.max(1, ...numeric);
  return (
    <div className="rounded-2xl border bg-white p-5 dark:bg-[#16181d] dark:border-gray-800">
      <div className="mb-4 flex flex-wrap gap-3 text-xs">
        {keys.map((k) => (
          <span key={k.label} className="inline-flex items-center gap-1.5 text-gray-600">
            <span className="h-2 w-2 rounded-full" style={{ background: k.color }} />
            {k.label}
          </span>
        ))}
      </div>
      <div className="flex h-48 items-end gap-1 sm:gap-2">
        {series.map((p) => (
          <div key={p.date} className="flex flex-1 items-end justify-center gap-0.5">
            {keys.map((k) => (
              <div
                key={k.label}
                className="w-full max-w-[14px] rounded-t-md"
                style={{
                  height: `${Math.max(6, (Number(p[k.key]) / max) * 100)}%`,
                  background: k.color,
                  opacity: 0.9,
                }}
                title={`${p.label} ${k.label}: ${p[k.key]}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1 sm:gap-2 text-[10px] text-gray-500">
        {series.map((p) => (
          <span key={p.date} className="flex-1 truncate text-center">{p.label}</span>
        ))}
      </div>
    </div>
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
  if (!stats) return <p>Loading analytics...</p>;

  const kpis = [
    { label: 'Live shops', value: stats.totals.liveBusinesses, href: '/admin/businesses?status=active', tone: 'emerald' },
    { label: 'Shops created', value: stats.period.businessesCreated, href: '/admin/businesses', tone: 'indigo' },
    { label: 'Live shops created', value: stats.period.liveCreated, href: '/admin/businesses?status=active', tone: 'teal' },
    { label: 'Owners joined', value: stats.period.ownersJoined, href: '/admin/accounts?role=OWNER', tone: 'violet' },
    { label: 'Customers joined', value: stats.period.customersJoined, href: '/admin/accounts?role=CUSTOMER', tone: 'sky' },
    { label: 'Bookings', value: stats.period.bookingsInRange, href: '/admin', tone: 'amber' },
  ];

  const tones: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-600',
    indigo: 'from-indigo-500 to-indigo-600',
    teal: 'from-teal-500 to-teal-600',
    violet: 'from-violet-500 to-violet-600',
    sky: 'from-sky-500 to-sky-600',
    amber: 'from-amber-500 to-amber-600',
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Live shops, new owners, customers, and bookings for the selected window.
          </p>
        </div>
        <div className="flex rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium ${
                range === r.id ? 'bg-white text-indigo-700 shadow-sm dark:bg-[#16181d]' : 'text-gray-600'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {!stats.email?.configured && (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
          Email is not linked on Railway yet. Add <code className="font-mono">RESEND_API_KEY</code> and{' '}
          <code className="font-mono">EMAIL_FROM=Apointo &lt;noreply@apointo.online&gt;</code> on the apointo service, then press Send test email.
        </p>
      )}
      <div className="mt-4">
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            const res = await fetch('/api/admin/email-test', { method: 'POST' });
            const data = await res.json();
            await reportEmailResponse(res, data, showEmailResult, 'Email sent successfully');
          }}
        >
          Send test email to my inbox
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`rounded-2xl bg-gradient-to-br ${tones[c.tone]} p-5 text-white shadow-sm`}
          >
            <p className="text-sm text-white/80">{c.label}</p>
            <p className="mt-2 text-3xl font-bold">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <BarChart
          series={stats.series}
          keys={[
            { key: 'owners', color: '#8b5cf6', label: 'Owners joined' },
            { key: 'customers', color: '#0ea5e9', label: 'Customers joined' },
          ]}
        />
        <BarChart
          series={stats.series}
          keys={[
            { key: 'live', color: '#10b981', label: 'Live shops created' },
            { key: 'businesses', color: '#6366f1', label: 'Shops created' },
            { key: 'bookings', color: '#f59e0b', label: 'Bookings' },
          ]}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 text-sm">
        <div className="rounded-2xl border bg-white p-4 dark:bg-[#16181d] dark:border-gray-800">
          <p className="text-gray-500">All owners</p>
          <p className="text-xl font-semibold">{stats.totals.owners}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 dark:bg-[#16181d] dark:border-gray-800">
          <p className="text-gray-500">All customers</p>
          <p className="text-xl font-semibold">{stats.totals.customers}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 dark:bg-[#16181d] dark:border-gray-800">
          <p className="text-gray-500">Not live shops</p>
          <p className="text-xl font-semibold text-red-600">{stats.totals.disabledBusinesses}</p>
        </div>
      </div>
    </div>
  );
}
