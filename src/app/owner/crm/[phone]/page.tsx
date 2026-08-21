'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ChevronLeft, MessageCircle, Phone } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/Button';
import { formatTime12h } from '@/lib/utils';
import { telLink, whatsappLink, type CrmStatus } from '@/lib/crm';

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
}

export default function OwnerCrmProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ phone: string }>();
  const [customer, setCustomer] = useState<Detail | null>(null);
  const [notes, setNotes] = useState('');
  const [statusOverride, setStatusOverride] = useState('AUTO');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
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
    if (!user || user.role !== 'OWNER' || !params.phone) return;
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
      });
  }, [params.phone, user]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (error && !customer) {
    return (
      <div className="p-6">
        <Link href="/owner/crm" className="text-sm text-indigo-600">
          Back to CRM
        </Link>
        <p className="mt-4 text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  if (!customer) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

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
        body: JSON.stringify({ notes, statusOverride }),
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
            CRM
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
            <Phone size={16} /> Call {customer.phone}
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

        <section className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-[#16181d]">
          <p className="text-sm font-medium">Private notes</p>
          <p className="mb-2 text-xs text-gray-500">Only you see this — allergies, preferred staff, extra time.</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
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
            {saving ? 'Saving...' : 'Save notes'}
          </Button>
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
