'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { reportEmailResponse, useEmailNotice } from '@/components/admin/EmailNotice';

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

function AccountsInner() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState('');
  const [role, setRole] = useState(searchParams.get('role') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const { showEmailResult } = useEmailNotice();
  const [users, setUsers] = useState<Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string;
    role: string;
    isActive: boolean;
    disabledReason: string | null;
  }>>([]);
  const [msg, setMsg] = useState('');
  const [createdSecret, setCreatedSecret] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'OWNER', password: '' });
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: '', email: '', phone: '' });

  const load = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    fetch(`/api/admin/accounts?${params}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error);
      return;
    }
    setCreatedSecret(data.password);
    setMsg(`Created ${data.user.email}. Password is ready — send the confirmation email when you want.`);
    setForm({ name: '', email: '', phone: '', role: 'OWNER', password: '' });
    load();
  };

  const saveEdit = async (id: string) => {
    const res = await fetch('/api/admin/accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...edit }),
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

  const toggle = async (id: string, isActive: boolean) => {
    const reason = isActive ? '' : window.prompt('Reason for disabling this login?') || 'Disabled by Apointo admin';
    const res = await fetch('/api/admin/accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error);
      return;
    }
    load();
  };

  const sendCreds = async (id: string) => {
    const res = await fetch(`/api/admin/accounts/${id}/credentials`, { method: 'POST' });
    const data = await res.json();
    const ok = await reportEmailResponse(res, data, showEmailResult, 'Email sent successfully');
    if (ok && data.password) setCreatedSecret(data.password);
    if (!ok) setMsg(data.error || 'Error: Unable to send');
  };

  const reset = async (id: string) => {
    const res = await fetch(`/api/admin/accounts/${id}/reset`, { method: 'POST' });
    const data = await res.json();
    await reportEmailResponse(res, data, showEmailResult, 'Email sent successfully');
    if (!res.ok) setMsg(data.error || 'Error: Unable to send');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Accounts</h1>
      <p className="mt-1 text-sm text-gray-600">
        Create an owner or customer first, reset their password, then send the confirmation email with login details.
      </p>
      {msg ? <p className="mt-3 text-sm text-indigo-700">{msg}</p> : null}
      {createdSecret ? (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Temporary password (copy now): <strong>{createdSecret}</strong>
        </p>
      ) : null}

      <form onSubmit={create} className="mt-6 grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-2 dark:bg-[#16181d] dark:border-gray-800">
        <p className="sm:col-span-2 font-semibold">Create owner or customer</p>
        <Input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select className="rounded-xl border px-3 py-3 dark:bg-[#0b0d12]" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="OWNER">Business owner</option>
          <option value="CUSTOMER">Customer</option>
        </select>
        <Input className="sm:col-span-2" placeholder="Temporary password (leave blank to auto-generate)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Button type="submit" className="sm:col-span-2">Create account (no email yet)</Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Input placeholder="Search name, email, phone" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <select className="rounded-xl border px-3 dark:bg-[#0b0d12]" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="OWNER">Owner</option>
          <option value="CUSTOMER">Customer</option>
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select className="rounded-xl border px-3 dark:bg-[#0b0d12]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Live</option>
          <option value="disabled">Not live</option>
        </select>
        <Button onClick={load}>Search</Button>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border bg-white dark:bg-[#16181d] dark:border-gray-800">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="p-3">Person</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t dark:border-gray-800">
                <td className="p-3">
                  {editing === u.id ? (
                    <div className="space-y-2 max-w-xs">
                      <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                      <Input value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
                      <Input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(u.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-gray-500">{u.email} · {u.phone}</p>
                    </>
                  )}
                </td>
                <td className="p-3">{u.role}</td>
                <td className="p-3"><LivePill live={u.isActive} /></td>
                <td className="p-3 space-x-2 whitespace-nowrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(u.id);
                      setEdit({ name: u.name, email: u.email || '', phone: u.phone });
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => sendCreds(u.id)}>Send credentials</Button>
                  <Button size="sm" variant="ghost" onClick={() => reset(u.id)}>Reset link</Button>
                  <Button size="sm" variant={u.isActive ? 'danger' : 'primary'} onClick={() => toggle(u.id, !u.isActive)}>
                    {u.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Link className="text-indigo-600 text-sm" href={`/admin/crm/${u.id}`}>CRM</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminAccountsPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <AccountsInner />
    </Suspense>
  );
}
