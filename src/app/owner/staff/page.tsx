'use client';

import { FormEvent, useEffect, useState } from 'react';
import { IdCard, Plus, Trash2 } from 'lucide-react';
import { useActiveBusiness } from '@/components/ActiveBusinessProvider';
import { OwnerSubpageFrame } from '@/components/owner/OwnerSubpageFrame';
import { StaffIdCardModal, type StaffIdView } from '@/components/owner/StaffIdCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { compressImage } from '@/components/profile/compressImage';
import { SHOP_FEATURES, SHOP_FEATURE_LABELS, defaultStaffPrivileges, type ShopPrivilegeMap } from '@/lib/shop-privileges';

type StaffRow = {
  id: string;
  name: string;
  role: string | null;
  isActive: boolean;
  phone: string | null;
  email: string | null;
  bio: string | null;
  photo: string | null;
  employeeCode: string | null;
  employeeCodeDisplay: string;
  hasLogin: boolean;
  privileges: ShopPrivilegeMap;
};

type LoginOnce = { phone: string; password: string; whatsapp: string | null; employeeCode: string };

const empty = {
  name: '',
  role: 'Team member',
  phone: '',
  email: '',
  bio: '',
  photo: '' as string,
};

export default function OwnerStaffPage() {
  const { active, loaded } = useActiveBusiness();
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [ready, setReady] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(empty);
  const [privileges, setPrivileges] = useState<ShopPrivilegeMap>(defaultStaffPrivileges());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [idCard, setIdCard] = useState<StaffIdView | null>(null);
  const [loginOnce, setLoginOnce] = useState<Record<string, LoginOnce>>({});

  const load = () => {
    if (!active?.id) {
      setStaff([]);
      setReady(true);
      return;
    }
    fetch(`/api/owner/staff?businessId=${active.id}`)
      .then((r) => r.json())
      .then((d) => {
        setStaff((d.staff || []).filter((s: StaffRow) => s.isActive));
        setCanManage(Boolean(d.canManage));
      })
      .finally(() => setReady(true));
  };

  useEffect(() => {
    if (!loaded) return;
    setReady(false);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, loaded]);

  const onPhoto = async (file?: File) => {
    if (!file) return;
    setForm({ ...form, photo: await compressImage(file, 400) });
  };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!active?.id) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/owner/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, businessId: active.id, privileges }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not add staff');
      setShowAdd(false);
      setForm(empty);
      setPrivileges(defaultStaffPrivileges());
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Remove this staff member and disable their login?')) return;
    const res = await fetch(`/api/owner/staff/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  const createLogin = async (id: string) => {
    const res = await fetch(`/api/owner/staff/${id}/login`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      window.alert(data.error || 'Could not create login');
      return;
    }
    setLoginOnce((prev) => ({ ...prev, [id]: data.login }));
    load();
  };

  return (
    <OwnerSubpageFrame title="Staff" subtitle="Add people, save bio data, print IDs, and set dashboard access">
      {!ready ? (
        <p className="px-4 text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-3 px-4">
          {canManage ? (
            <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
              <Plus size={16} className="mr-1" /> Add staff
            </Button>
          ) : (
            <p className="text-xs text-gray-500">You can view the team. Only the owner can add or remove staff.</p>
          )}

          {showAdd && canManage ? (
            <form onSubmit={add} className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
              <label className="flex cursor-pointer items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-xl bg-white">
                  {form.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[10px] text-gray-500">Photo</span>
                  )}
                </div>
                <span className="text-sm font-medium text-indigo-700">ID photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
              </label>
              <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input placeholder="Role (stylist, doctor, receptionist)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              <Input placeholder="10-digit phone (needed for login)" inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <textarea
                placeholder="Bio / notes"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-[#0b0d12]"
              />
              <p className="text-xs font-medium text-gray-600">Dashboard privileges</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {SHOP_FEATURES.filter((f) => f !== 'home').map((feature) => (
                  <label key={feature} className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 dark:bg-[#0b0d12]">
                    <input
                      type="checkbox"
                      checked={privileges[feature] === 'EDIT' || (feature !== 'staff' && privileges[feature] === 'READ')}
                      disabled={feature === 'staff' ? false : false}
                      onChange={(e) =>
                        setPrivileges({
                          ...privileges,
                          [feature]: e.target.checked ? (feature === 'staff' ? 'EDIT' : 'EDIT') : 'NONE',
                        })
                      }
                    />
                    {SHOP_FEATURE_LABELS[feature]}
                    {feature === 'staff' ? ' (edit team)' : ''}
                  </label>
                ))}
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Saving...' : 'Save staff + create ID'}
              </Button>
            </form>
          ) : null}

          {staff.length === 0 ? (
            <p className="text-sm text-gray-500">No staff listed yet. Add someone to print an Apointo ID.</p>
          ) : (
            staff.map((member) => (
              <article key={member.id} className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-[#16181d]">
                <div className="flex gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-xl bg-gray-100">
                    {member.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.photo} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">{member.name}</h2>
                    <p className="text-sm text-gray-500">{member.role || 'Team member'}</p>
                    <p className="font-mono text-xs">{member.employeeCodeDisplay}</p>
                    {member.bio ? <p className="mt-1 text-xs text-gray-500">{member.bio}</p> : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setIdCard({
                        name: member.name,
                        role: member.role,
                        employeeCode: member.employeeCode,
                        photo: member.photo,
                        businessName: active?.name || 'Apointo',
                        phone: member.phone,
                      })
                    }
                  >
                    <IdCard size={14} className="mr-1" /> ID card
                  </Button>
                  {canManage ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => createLogin(member.id)}>
                        {member.hasLogin ? 'Reset login' : 'Create login'}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => remove(member.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </>
                  ) : null}
                </div>
                {loginOnce[member.id] ? (
                  <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm dark:bg-emerald-950/40">
                    <p className="font-medium">Give them this once</p>
                    <p>Phone: {loginOnce[member.id].phone}</p>
                    <p>Password: {loginOnce[member.id].password}</p>
                    <p>ID: {loginOnce[member.id].employeeCode}</p>
                    {loginOnce[member.id].whatsapp ? (
                      <a className="mt-2 inline-block text-emerald-800" href={loginOnce[member.id].whatsapp!} target="_blank" rel="noreferrer">
                        WhatsApp credentials
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      )}
      <StaffIdCardModal open={Boolean(idCard)} card={idCard} onClose={() => setIdCard(null)} />
    </OwnerSubpageFrame>
  );
}
