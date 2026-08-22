'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function AdminCrmDetailPage() {
  const params = useParams<{ userId: string }>();
  const [contact, setContact] = useState<{
    name: string;
    email: string | null;
    phone: string;
    role: string;
    bookingCount: number;
    notes?: string;
    tags?: string;
    businesses?: Array<{ id: string; name: string; slug: string; isActive: boolean }>;
    shopCrm?: Array<{
      ownerName: string;
      notes?: string | null;
      lastWorkNotes?: string | null;
      tags?: string | null;
      address?: string | null;
      email?: string | null;
    }>;
    shopMedia?: Array<{ id: string; kind: string; data: string }>;
  } | null>(null);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`/api/admin/crm/${params.userId}`)
      .then((r) => r.json())
      .then((d) => {
        setContact(d.contact);
        setNotes(d.contact?.notes || '');
        setTags(d.contact?.tags || '');
      });
  }, [params.userId]);

  if (!contact) return <p>Loading...</p>;

  const save = async () => {
    const res = await fetch(`/api/admin/crm/${params.userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, tags }),
    });
    setMsg(res.ok ? 'Saved' : 'Could not save');
  };

  return (
    <div className="max-w-xl space-y-4">
      <Link href="/admin/crm" className="text-sm text-indigo-600">Back to CRM</Link>
      <h1 className="text-2xl font-bold">{contact.name}</h1>
      <p className="text-sm text-gray-600">{contact.email} · {contact.phone} · {contact.role}</p>
      <p className="text-sm">{contact.bookingCount} bookings · {contact.businesses?.length || 0} shops</p>
      {contact.businesses?.length ? (
        <ul className="text-sm list-disc pl-5">
          {contact.businesses.map((b: { id: string; name: string; slug: string; isActive: boolean }) => (
            <li key={b.id}>{b.name} /{b.slug} {b.isActive ? '' : '(disabled)'}</li>
          ))}
        </ul>
      ) : null}
      <label className="block text-sm font-medium">Tags</label>
      <input className="w-full rounded-xl border px-3 py-2 dark:bg-[#0b0d12]" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vip, delhi" />
      <label className="block text-sm font-medium">Notes</label>
      <textarea className="w-full rounded-xl border px-3 py-2 dark:bg-[#0b0d12]" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button onClick={save}>Save notes</Button>
      {msg ? <p className="text-sm text-indigo-700">{msg}</p> : null}

      {contact.shopCrm?.length ? (
        <section className="rounded-2xl border p-4">
          <h2 className="font-semibold">Shop CRM (synced from owners)</h2>
          {contact.shopCrm.map((row: {
            ownerName: string;
            notes?: string | null;
            lastWorkNotes?: string | null;
            tags?: string | null;
            address?: string | null;
            email?: string | null;
          }, i: number) => (
            <article key={i} className="mt-3 text-sm">
              <p className="font-medium">{row.ownerName}</p>
              {row.email ? <p>Email: {row.email}</p> : null}
              {row.address ? <p>Address: {row.address}</p> : null}
              {row.tags ? <p>Tags: {row.tags}</p> : null}
              {row.lastWorkNotes ? <p>Last work: {row.lastWorkNotes}</p> : null}
              {row.notes ? <p>Notes: {row.notes}</p> : null}
            </article>
          ))}
        </section>
      ) : null}

      {contact.shopMedia?.length ? (
        <section className="grid grid-cols-2 gap-2">
          {contact.shopMedia.map((m: { id: string; kind: string; data: string }) =>
            m.kind === 'VIDEO' ? (
              <video key={m.id} src={m.data} controls className="h-28 w-full rounded-xl object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={m.id} src={m.data} alt="" className="h-28 w-full rounded-xl object-cover" />
            )
          )}
        </section>
      ) : null}
    </div>
  );
}
