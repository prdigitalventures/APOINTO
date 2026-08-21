'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { MessageCircle, Phone, Plus, Search, UsersRound } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatTime12h } from '@/lib/utils';
import { telLink, whatsappLink, type CrmStatus } from '@/lib/crm';

interface Customer {
  phone: string;
  name: string;
  lastBooking: string | null;
  lastBookingTime: string | null;
  lastServiceName: string | null;
  businessName: string | null;
  businessId: string | null;
  visitCount: number;
  status: CrmStatus;
}

const STATUS_STYLE: Record<CrmStatus, string> = {
  NEW: 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  REGULAR: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  INACTIVE: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
};

export default function OwnerCrmPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shops, setShops] = useState<Array<{ id: string; name: string }>>([]);
  const [q, setQ] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'OWNER') router.push('/customer');
  }, [loading, router, user]);

  useEffect(() => {
    if (!user || user.role !== 'OWNER') return;
    fetch('/api/businesses')
      .then((r) => r.json())
      .then((d) => setShops((d.businesses || []).map((b: { id: string; name: string }) => ({ id: b.id, name: b.name }))));
  }, [user]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (businessId) params.set('businessId', businessId);
    return params.toString();
  }, [q, businessId]);

  useEffect(() => {
    if (!user || user.role !== 'OWNER') return;
    const t = setTimeout(() => {
      fetch(`/api/owner/customers${query ? `?${query}` : ''}`)
        .then((r) => r.json())
        .then((d) => setCustomers(d.customers || []))
        .finally(() => setLoaded(true));
    }, 200);
    return () => clearTimeout(t);
  }, [query, user]);

  if (loading || !user || !loaded) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const addWalkIn = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/owner/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addName, phone: addPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not add');
      setShowAdd(false);
      setAddName('');
      setAddPhone('');
      router.push(`/owner/crm/${data.customer.phone}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="border-b border-gray-100 bg-white px-4 py-4 dark:border-gray-800 dark:bg-[#16181d]">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <UsersRound size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold">Customer CRM</h1>
            <p className="text-xs text-gray-500">Find, call, and remember who booked</p>
          </div>
          <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
            <Plus size={16} className="mr-1" />
            Add
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-3 p-4">
        {showAdd ? (
          <form
            onSubmit={addWalkIn}
            className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/50"
          >
            <p className="text-sm font-medium">Add walk-in customer</p>
            <Input placeholder="Name" value={addName} onChange={(e) => setAddName(e.target.value)} />
            <Input placeholder="10-digit phone" inputMode="numeric" value={addPhone} onChange={(e) => setAddPhone(e.target.value)} />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Save to CRM'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search name or phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {shops.length > 1 ? (
          <select
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-[#0b0d12]"
          >
            <option value="">All shops</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        ) : null}

        {customers.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <UsersRound className="mx-auto mb-3 text-violet-200" size={34} />
            <p>No customers yet</p>
            <p className="mt-1 text-sm">Share your booking link or add a walk-in.</p>
          </div>
        ) : (
          customers.map((customer) => {
            const wa = whatsappLink(
              customer.phone,
              `Hi ${customer.name}, this is ${customer.businessName || 'Apointo'}${
                customer.lastServiceName ? ` regarding your ${customer.lastServiceName}` : ''
              }${customer.lastBooking ? ` on ${format(new Date(customer.lastBooking), 'd MMM')}` : ''}.`
            );
            return (
              <article
                key={customer.phone}
                className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-[#16181d]"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/owner/crm/${customer.phone}`} className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold">{customer.name}</h2>
                    <p className="mt-0.5 text-sm text-gray-500">{customer.phone}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      {customer.visitCount} visit{customer.visitCount === 1 ? '' : 's'}
                      {customer.lastServiceName ? ` · ${customer.lastServiceName}` : ''}
                    </p>
                  </Link>
                  <div className="shrink-0 text-right">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[customer.status]}`}>
                      {customer.status === 'NEW' ? 'New' : customer.status === 'REGULAR' ? 'Regular' : 'Inactive'}
                    </span>
                    {customer.lastBooking ? (
                      <>
                        <p className="mt-2 text-xs text-gray-500">Last booking</p>
                        <p className="text-sm font-medium">{format(new Date(customer.lastBooking), 'MMM d, yyyy')}</p>
                        {customer.lastBookingTime ? (
                          <p className="text-xs text-gray-500">{formatTime12h(customer.lastBookingTime)}</p>
                        ) : null}
                      </>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500">Walk-in only</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <a
                    href={telLink(customer.phone)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-indigo-50 py-2 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
                  >
                    <Phone size={14} /> Call
                  </a>
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-50 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                  <Link
                    href={`/owner/crm/${customer.phone}`}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-gray-50 py-2 text-sm font-medium dark:bg-gray-800"
                  >
                    History
                  </Link>
                </div>
                {customer.businessName ? (
                  <p className="mt-2 text-xs text-gray-500">{customer.businessName}</p>
                ) : null}
              </article>
            );
          })
        )}
      </main>
    </div>
  );
}
