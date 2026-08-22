'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Campaign = {
  id: string;
  name: string;
  subject: string;
  audience: string;
  status: string;
  recipientCount: number;
  sentAt: string | null;
};

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    name: 'Independence Day greetings',
    subject: 'Happy Independence Day from Apointo',
    audience: 'ALL',
    body: '<p>Wishing you a wonderful Independence Day. Thank you for being part of Apointo.</p>',
  });

  const load = () => {
    fetch('/api/admin/campaigns')
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns || []));
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error);
      return;
    }
    setMsg('Draft saved');
    load();
  };

  const send = async (id: string) => {
    if (!window.confirm('Send this email to the selected audience now?')) return;
    const res = await fetch(`/api/admin/campaigns/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send' }),
    });
    const data = await res.json();
    setMsg(res.ok ? `Sent to ${data.sent} people` : data.error);
    load();
  };

  const whatsapp = async (id: string) => {
    const res = await fetch(`/api/admin/campaigns/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'whatsapp' }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMsg(data.error);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'apointo-whatsapp.csv';
    a.click();
    setMsg('Downloaded phone list. Bulk WhatsApp send needs Meta Cloud API keys — this CSV is for your WhatsApp tool.');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Campaigns</h1>
      <p className="mt-1 text-sm text-gray-600">
        Email greetings and updates to registered owners and customers. WhatsApp bulk send needs Cloud API; until then export the phone list.
      </p>
      {msg ? <p className="mt-3 text-sm text-indigo-700">{msg}</p> : null}

      <form onSubmit={create} className="mt-6 space-y-3 rounded-2xl border bg-white p-5 dark:bg-[#16181d] dark:border-gray-800">
        <Input required placeholder="Campaign name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input required placeholder="Email subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <select className="w-full rounded-xl border px-3 py-3 dark:bg-[#0b0d12]" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
          <option value="ALL">All owners and customers</option>
          <option value="OWNERS">Owners only</option>
          <option value="CUSTOMERS">Customers only</option>
        </select>
        <textarea className="w-full rounded-xl border px-3 py-2 dark:bg-[#0b0d12]" rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <Button type="submit">Save draft</Button>
      </form>

      <div className="mt-6 space-y-3">
        {campaigns.map((c) => (
          <div key={c.id} className="rounded-2xl border bg-white p-4 dark:bg-[#16181d] dark:border-gray-800">
            <p className="font-semibold">{c.name}</p>
            <p className="text-sm text-gray-500">{c.subject} · {c.audience} · {c.status}{c.recipientCount ? ` · ${c.recipientCount} sent` : ''}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => send(c.id)}>Send email</Button>
              <Button size="sm" variant="outline" onClick={() => whatsapp(c.id)}>Export WhatsApp list</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
