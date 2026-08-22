'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function LivePill({ live }: { live: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        live ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
      }`}
    >
      {live ? 'Live' : 'Not live'}
    </span>
  );
}

function BusinessesInner() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [rows, setRows] = useState<Array<{
    id: string;
    name: string;
    slug: string;
    location: string | null;
    uniqueCode: string | null;
    isActive: boolean;
    disabledReason: string | null;
    ownerUser: { email: string | null; name: string; phone: string };
    _count: { bookings: number };
  }>>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: 'beauty',
    location: '',
    description: '',
    ownerEmail: '',
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: '', location: '', ownerEmail: '' });

  const load = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    fetch(`/api/admin/businesses?${params}`)
      .then((r) => r.json())
      .then((d) => setRows(d.businesses || []));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error);
      return;
    }
    setMsg(`Shop ${data.business.name} created. Send the owner email when you are ready.`);
    setForm({ name: '', category: 'beauty', location: '', description: '', ownerEmail: '' });
    load();
  };

  const toggle = async (id: string, isActive: boolean) => {
    const reason = isActive ? '' : window.prompt('Why disable this listing?') || 'Duplicate or malpractice';
    const res = await fetch(`/api/admin/businesses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive, reason }),
    });
    const data = await res.json();
    if (!res.ok) setMsg(data.error);
    else load();
  };

  const saveEdit = async (id: string) => {
    const res = await fetch(`/api/admin/businesses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: edit.name, location: edit.location, ownerEmail: edit.ownerEmail }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error);
      return;
    }
    setEditing(null);
    setMsg('Saved');
    load();
  };

  const notify = async (id: string) => {
    const res = await fetch(`/api/admin/businesses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'notify' }),
    });
    const data = await res.json();
    setMsg(res.ok ? (data.emailSent ? 'Shop-ready email sent' : 'Email not configured') : data.error);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Businesses</h1>
      <p className="mt-1 text-sm text-gray-600">
        Create the owner on Accounts first. Then create the shop here and send the confirmation email when you are ready.
      </p>
      {msg ? <p className="mt-3 text-sm text-indigo-700">{msg}</p> : null}

      <form onSubmit={create} className="mt-6 grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-2 dark:bg-[#16181d] dark:border-gray-800">
        <p className="sm:col-span-2 font-semibold">Create shop (no email yet)</p>
        <Input required placeholder="Business name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Category (beauty, legal, spa…)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <Input required type="email" placeholder="Existing owner email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
        <Input className="sm:col-span-2" placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Button type="submit" className="sm:col-span-2">Create shop</Button>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <select className="rounded-xl border px-3 dark:bg-[#0b0d12]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="active">Live</option>
          <option value="disabled">Not live</option>
        </select>
        <Button onClick={load}>Search</Button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border bg-white dark:bg-[#16181d] dark:border-gray-800">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="p-3">Shop</th>
              <th className="p-3">Owner</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-t dark:border-gray-800">
                <td className="p-3">
                  {editing === b.id ? (
                    <div className="space-y-2 max-w-xs">
                      <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                      <Input value={edit.location} onChange={(e) => setEdit({ ...edit, location: e.target.value })} placeholder="Location" />
                      <Input value={edit.ownerEmail} onChange={(e) => setEdit({ ...edit, ownerEmail: e.target.value })} placeholder="Owner email" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(b.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-gray-500">/{b.slug} · {b.uniqueCode || 'no code'} · {b._count.bookings} bookings</p>
                    </>
                  )}
                </td>
                <td className="p-3">
                  {b.ownerUser.email}<br />
                  <span className="text-gray-500">{b.ownerUser.name} · {b.ownerUser.phone}</span>
                </td>
                <td className="p-3"><LivePill live={b.isActive} /></td>
                <td className="p-3 space-x-2 whitespace-nowrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(b.id);
                      setEdit({
                        name: b.name,
                        location: b.location || '',
                        ownerEmail: b.ownerUser.email || '',
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => notify(b.id)}>Email owner</Button>
                  <Button size="sm" variant={b.isActive ? 'danger' : 'primary'} onClick={() => toggle(b.id, !b.isActive)}>
                    {b.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminBusinessesPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <BusinessesInner />
    </Suspense>
  );
}
