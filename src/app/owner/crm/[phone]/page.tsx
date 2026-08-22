'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ChevronLeft, MessageCircle, Phone } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatTime12h } from '@/lib/utils';
import { telLink, whatsappLink, revisitReminderText, type CrmStatus } from '@/lib/crm';
import { isShopDashboardRole } from '@/lib/shop-privileges';
import { readMediaFile } from '@/lib/read-media-file';

interface HistoryRow {
  date: string;
  startTime: string;
  serviceName: string;
  staffName: string | null;
  status: string;
  isWalkIn: boolean;
  businessName: string;
  notes: string | null;
}

interface Detail {
  phone: string;
  name: string;
  notes: string;
  status: CrmStatus;
  statusOverride: string | null;
  visitCount: number;
  lastBooking: string | null;
  lastServiceName: string | null;
  businessName: string | null;
  history: HistoryRow[];
  email?: string;
  address?: string;
  birthday?: string;
  tags?: string;
  lastWorkNotes?: string;
  media?: Array<{ id: string; kind: string; data: string; caption: string | null }>;
}

export default function OwnerCrmProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ phone: string }>();
  const [customer, setCustomer] = useState<Detail | null>(null);
  const [notes, setNotes] = useState('');
  const [statusOverride, setStatusOverride] = useState('AUTO');
  const [lastWorkNotes, setLastWorkNotes] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [birthday, setBirthday] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!isShopDashboardRole(user.role)) router.push('/customer');
  }, [loading, router, user]);

  useEffect(() => {
    if (!user || !isShopDashboardRole(user.role) || !params.phone) return;
    fetch(`/api/owner/customers/${params.phone}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.customer) {
          setError(d.error || 'Not found');
          return;
        }
        setCustomer(d.customer);
        setNotes(d.customer.notes || '');
        setStatusOverride(d.customer.statusOverride || 'AUTO');
        setLastWorkNotes(d.customer.lastWorkNotes || '');
        setEmail(d.customer.email || '');
        setAddress(d.customer.address || '');
        setBirthday(d.customer.birthday || '');
        setTags(d.customer.tags || '');
      });
  }, [params.phone, user]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (error && !customer) {
    return (
      <div className="p-6">
        <Link href="/owner/crm" className="text-sm text-indigo-600">
          Back to customers
        </Link>
        <p className="mt-4 text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  if (!customer) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const reminder = whatsappLink(
    customer.phone,
    revisitReminderText({
      name: customer.name,
      businessName: customer.businessName,
      lastServiceName: customer.lastServiceName,
    })
  );
  const wa = whatsappLink(
    customer.phone,
    `Hi ${customer.name}, this is ${customer.businessName || 'Apointo'}${
      customer.lastServiceName ? ` regarding your ${customer.lastServiceName}` : ''
    }.`
  );

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/owner/customers/${customer.phone}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          statusOverride,
          lastWorkNotes,
          email,
          address,
          birthday,
          tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save');
      setCustomer(data.customer);
      setMessage('Notes saved. The customer cannot see this.');
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="border-b border-gray-100 bg-white px-4 py-4 dark:border-gray-800 dark:bg-[#16181d]">
        <div className="mx-auto max-w-lg">
          <Link href="/owner/crm" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
            <ChevronLeft size={16} />
            Customers
          </Link>
          <h1 className="font-semibold">{customer.name}</h1>
          <p className="text-xs text-gray-500">
            {customer.visitCount} visit{customer.visitCount === 1 ? '' : 's'} · {customer.status === 'NEW' ? 'New' : customer.status === 'REGULAR' ? 'Regular' : 'Inactive'}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2">
          <a
            href={telLink(customer.phone)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white"
          >
            <Phone size={16} /> Call
          </a>
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-medium text-white"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
        </div>
        <a
          href={reminder}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center rounded-xl bg-amber-500 py-3 text-sm font-medium text-white"
        >
          Send visit-again reminder
        </a>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-[#16181d]">
          <p className="text-sm font-medium">Customer record</p>
          <p className="mb-2 text-xs text-gray-500">Saved to your shop CRM and visible to Apointo admin.</p>
          <div className="space-y-2">
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <Input placeholder="Birthday (dd/mm)" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
            <Input placeholder="Tags (vip, colour, allergy)" value={tags} onChange={(e) => setTags(e.target.value)} />
            <textarea
              value={lastWorkNotes}
              onChange={(e) => setLastWorkNotes(e.target.value)}
              rows={3}
              placeholder="What we did last time (cut, colour formula, notes)"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-[#0b0d12]"
            />
          </div>
          <p className="mt-3 text-sm font-medium">Private notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-[#0b0d12]"
          />
          <label className="mt-3 block text-xs text-gray-500">Status</label>
          <select
            value={statusOverride}
            onChange={(e) => setStatusOverride(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-[#0b0d12]"
          >
            <option value="AUTO">Automatic (New / Regular / Inactive)</option>
            <option value="NEW">New</option>
            <option value="REGULAR">Regular</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          {message ? <p className="mt-2 text-sm text-emerald-600">{message}</p> : null}
          <Button className="mt-3 w-full" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save customer record'}
          </Button>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-[#16181d]">
          <p className="text-sm font-medium">Work photos & videos</p>
          <p className="mb-2 text-xs text-gray-500">Keep a record of the last look for this customer.</p>
          <label className="inline-flex cursor-pointer rounded-xl bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700">
            Upload photo or video
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const parsed = await readMediaFile(file);
                  const res = await fetch(`/api/owner/customers/${customer.phone}/media`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parsed),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Could not upload');
                  const refreshed = await fetch(`/api/owner/customers/${customer.phone}`).then((r) => r.json());
                  setCustomer(refreshed.customer);
                } catch (err) {
                  setMessage((err as Error).message);
                }
              }}
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(customer.media || []).map((item) => (
              <figure key={item.id} className="overflow-hidden rounded-xl bg-gray-100">
                {item.kind === 'VIDEO' ? (
                  <video src={item.data} controls className="h-28 w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.data} alt="" className="h-28 w-full object-cover" />
                )}
                <button
                  type="button"
                  className="w-full py-1 text-xs text-red-600"
                  onClick={async () => {
                    await fetch(`/api/owner/customers/${customer.phone}/media/${item.id}`, { method: 'DELETE' });
                    const refreshed = await fetch(`/api/owner/customers/${customer.phone}`).then((r) => r.json());
                    setCustomer(refreshed.customer);
                  }}
                >
                  Remove
                </button>
              </figure>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium">Visit history</h2>
          {customer.history.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-4 text-sm text-gray-500">
              No bookings yet. You can still call or WhatsApp this walk-in.
            </p>
          ) : (
            <div className="space-y-2">
              {customer.history.map((row, i) => (
                <article
                  key={`${row.date}-${row.startTime}-${i}`}
                  className="rounded-2xl border border-gray-100 bg-white p-4 text-sm dark:border-gray-800 dark:bg-[#16181d]"
                >
                  <div className="flex justify-between gap-2">
                    <p className="font-medium">{row.serviceName}</p>
                    <p className="text-xs text-gray-500">{row.status.toLowerCase()}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {format(new Date(row.date), 'EEE d MMM yyyy')} · {formatTime12h(row.startTime)}
                    {row.staffName ? ` · ${row.staffName}` : ''}
                    {row.isWalkIn ? ' · walk-in' : ''}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{row.businessName}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
