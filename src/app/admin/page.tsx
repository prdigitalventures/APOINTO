'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminHomePage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Could not load');
        setStats(data);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!stats) return <p>Loading...</p>;

  const cards = [
    { label: 'Owners', value: stats.owners, href: '/admin/crm?role=OWNER' },
    { label: 'Customers', value: stats.customers, href: '/admin/crm?role=CUSTOMER' },
    { label: 'Businesses', value: stats.businesses, href: '/admin/businesses' },
    { label: 'Disabled shops', value: stats.disabledBusinesses, href: '/admin/businesses?status=disabled' },
    { label: 'Disabled logins', value: stats.disabledUsers, href: '/admin/accounts?status=disabled' },
    { label: 'Bookings today', value: stats.bookingsToday, href: '/admin' },
    { label: 'Staff', value: stats.staff, href: '/admin/team' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Ops home</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Create shops, assign owners, disable malpractice listings, and keep every registered contact in CRM.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-2xl border bg-white p-5 dark:bg-[#16181d] dark:border-gray-800">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="mt-2 text-3xl font-bold">{c.value}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border bg-white p-5 text-sm dark:bg-[#16181d] dark:border-gray-800">
        <p className="font-semibold">New to the dashboard?</p>
        <p className="mt-1 text-gray-600">Open <Link className="text-indigo-600" href="/admin/help">How to use</Link> for employee tutorials.</p>
      </div>
    </div>
  );
}
