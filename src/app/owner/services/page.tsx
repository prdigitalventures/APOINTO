'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useActiveBusiness } from '@/components/ActiveBusinessProvider';
import { OwnerSubpageFrame } from '@/components/owner/OwnerSubpageFrame';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { canShop, ownerShopPrivileges } from '@/lib/shop-privileges';

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  isActive: boolean;
};

const emptyForm = { name: '', price: '', duration: '30', description: '' };

export default function OwnerServicesPage() {
  const { user } = useAuth();
  const { active, loaded } = useActiveBusiness();
  const canEdit = canShop(user?.shopPrivileges || ownerShopPrivileges(), 'services', 'EDIT');
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    if (!active?.id) {
      setServices([]);
      setReady(true);
      return;
    }
    fetch(`/api/owner/services?businessId=${active.id}`)
      .then((r) => r.json())
      .then((d) => setServices(d.services || []))
      .finally(() => setReady(true));
  };

  useEffect(() => {
    if (!loaded) return;
    setReady(false);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, loaded]);

  const startEdit = (row?: ServiceRow) => {
    if (row) {
      setEditing(row.id);
      setForm({
        name: row.name,
        price: String(row.price),
        duration: String(row.duration),
        description: row.description || '',
      });
    } else {
      setEditing('new');
      setForm(emptyForm);
    }
    setError('');
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!active?.id) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        businessId: active.id,
        name: form.name,
        price: Number(form.price),
        duration: Number(form.duration),
        description: form.description,
      };
      const res =
        editing === 'new'
          ? await fetch('/api/owner/services', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/owner/services/${editing}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save');
      setEditing(null);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Hide this service from customers?')) return;
    const res = await fetch(`/api/owner/services/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  return (
    <OwnerSubpageFrame title="Services" subtitle="Add, edit prices, or remove items for this shop">
      {!ready ? (
        <p className="px-4 text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-3 px-4">
          {canEdit ? (
            <Button size="sm" onClick={() => startEdit()}>
              <Plus size={16} className="mr-1" /> Add service
            </Button>
          ) : (
            <p className="text-xs text-gray-500">You can view the menu. Ask the owner to change prices.</p>
          )}

          {editing ? (
            <form onSubmit={save} className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
              <Input placeholder="Service name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" min={0} step="1" placeholder="Price ₹" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                <Input type="number" min={5} step="5" placeholder="Minutes" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required />
              </div>
              <Input placeholder="Short description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}

          {services.filter((s) => s.isActive).length === 0 ? (
            <p className="text-sm text-gray-500">No active services yet. Add haircut, spa, consult — whatever you sell.</p>
          ) : (
            services
              .filter((s) => s.isActive)
              .map((service) => (
                <article key={service.id} className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-[#16181d]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{service.name}</h2>
                      <p className="text-sm text-gray-500">{service.duration} min</p>
                      {service.description ? <p className="mt-1 text-xs text-gray-500">{service.description}</p> : null}
                    </div>
                    <p className="font-semibold tabular-nums">{formatCurrency(service.price)}</p>
                  </div>
                  {canEdit ? (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => startEdit(service)}>
                        <Pencil size={14} className="mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => remove(service.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ) : null}
                </article>
              ))
          )}
        </div>
      )}
    </OwnerSubpageFrame>
  );
}
