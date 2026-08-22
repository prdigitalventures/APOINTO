'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function AccountsInner() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState('');
  const [role, setRole] = useState(searchParams.get('role') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
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
    setMsg(isActive ? 'Account enabled' : 'Account disabled');
    load();
  };

  const reset = async (id: string) => {
    const res = await fetch(`/api/admin/accounts/${id}/reset`, { method: 'POST' });
    const data = await res.json();
    setMsg(res.ok ? (data.emailSent ? 'Reset email sent' : 'Reset link created (email not configured — check logs)') : data.error);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Accounts</h1>
      <p className="mt-1 text-sm text-gray-600">Disable logins or send a password reset email to any owner, customer, or staff user.</p>
      {msg ? <p className="mt-3 text-sm text-indigo-700">{msg}</p> : null}
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
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
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
                  <p className="font-medium">{u.name}</p>
                  <p className="text-gray-500">{u.email} · {u.phone}</p>
                </td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.isActive ? 'Active' : `Disabled${u.disabledReason ? ` — ${u.disabledReason}` : ''}`}</td>
                <td className="p-3 space-x-2 whitespace-nowrap">
                  <Button size="sm" variant={u.isActive ? 'danger' : 'primary'} onClick={() => toggle(u.id, !u.isActive)}>
                    {u.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reset(u.id)}>Send reset</Button>
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
