'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  notes: string;
  tags: string;
  _count: { businesses: number; bookings: number };
};

function CrmInner() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState('');
  const [role, setRole] = useState(searchParams.get('role') || '');
  const [contacts, setContacts] = useState<Contact[]>([]);

  const load = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (role) params.set('role', role);
    fetch(`/api/admin/crm?${params}`)
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts || []));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Platform CRM</h1>
      <p className="mt-1 text-sm text-gray-600">Every owner and customer who registered on Apointo. Owner shop CRM is separate.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <select className="rounded-xl border px-3 dark:bg-[#0b0d12]" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Owners and customers</option>
          <option value="OWNER">Owners</option>
          <option value="CUSTOMER">Customers</option>
        </select>
        <Button onClick={load}>Search</Button>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border bg-white dark:bg-[#16181d] dark:border-gray-800">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="p-3">Contact</th>
              <th className="p-3">Role</th>
              <th className="p-3">Activity</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="border-t dark:border-gray-800">
                <td className="p-3">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-gray-500">{c.email} · {c.phone}</p>
                </td>
                <td className="p-3">{c.role}{c.isActive ? '' : ' (disabled)'}</td>
                <td className="p-3">{c._count.businesses} shops · {c._count.bookings} bookings</td>
                <td className="p-3"><Link className="text-indigo-600" href={`/admin/crm/${c.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminCrmPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <CrmInner />
    </Suspense>
  );
}
