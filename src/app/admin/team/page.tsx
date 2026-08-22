'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ADMIN_FEATURES, FEATURE_LABELS, type AdminFeature, type PermissionLevel } from '@/lib/admin-permissions';

type Role = { id: string; name: string; permissions: Array<{ feature: string; level: string }> };
type Member = {
  id: string;
  name: string;
  email: string | null;
  department: string | null;
  roleName: string | null;
  staffRoleId: string | null;
  isActive: boolean;
  overrides: Record<string, PermissionLevel>;
};

export default function AdminTeamPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [audits, setAudits] = useState<Array<{ id: string; action: string; createdAt: string; actor: { name: string } }>>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: 'SALES', roleId: '' });

  const load = () => {
    Promise.all([
      fetch('/api/admin/roles').then((r) => r.json()),
      fetch('/api/admin/team').then((r) => r.json()),
      fetch('/api/admin/audits').then((r) => r.json()),
    ]).then(([r, t, a]) => {
      setRoles(r.roles || []);
      setMembers(t.members || []);
      setAudits(a.audits || []);
      if (!form.roleId && r.roles?.[0]) setForm((f) => ({ ...f, roleId: r.roles[0].id }));
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setMsg(res.ok ? `Invited ${form.email}` : data.error);
    if (res.ok) load();
  };

  const saveMember = async (m: Member, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/team/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setMsg(res.ok ? 'Updated' : data.error);
    if (res.ok) load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Team and privileges</h1>
      <p className="mt-1 text-sm text-gray-600">Invite Apointo employees and give read or read-and-edit access per area.</p>
      {msg ? <p className="mt-3 text-sm text-indigo-700">{msg}</p> : null}

      <form onSubmit={invite} className="mt-6 grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-2 dark:bg-[#16181d] dark:border-gray-800">
        <Input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input required type="email" placeholder="Work email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select className="rounded-xl border px-3 py-3 dark:bg-[#0b0d12]" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
          <option value="SALES">Sales</option>
          <option value="MEDIA">Media</option>
          <option value="SUPPORT">Support</option>
          <option value="OPS">Operations</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select className="rounded-xl border px-3 py-3 dark:bg-[#0b0d12] sm:col-span-2" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <Button type="submit" className="sm:col-span-2">Invite staff (sends reset email)</Button>
      </form>

      <div className="mt-6 space-y-4">
        {members.map((m) => (
          <div key={m.id} className="rounded-2xl border bg-white p-4 dark:bg-[#16181d] dark:border-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{m.name}</p>
                <p className="text-sm text-gray-500">{m.email} · {m.department} · {m.roleName || 'No role pack'}</p>
              </div>
              <Button size="sm" variant={m.isActive ? 'danger' : 'primary'} onClick={() => saveMember(m, { isActive: !m.isActive })}>
                {m.isActive ? 'Disable staff' : 'Enable'}
              </Button>
            </div>
            <div className="mt-3">
              <select
                className="rounded-xl border px-3 py-2 text-sm dark:bg-[#0b0d12]"
                value={m.staffRoleId || ''}
                onChange={(e) => saveMember(m, { roleId: e.target.value })}
              >
                <option value="">Role pack</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {ADMIN_FEATURES.map((feature: AdminFeature) => (
                <label key={feature} className="flex items-center justify-between text-sm">
                  <span>{FEATURE_LABELS[feature]}</span>
                  <select
                    className="rounded-lg border px-2 py-1 dark:bg-[#0b0d12]"
                    value={m.overrides[feature] || ''}
                    onChange={(e) =>
                      saveMember(m, { overrides: { ...m.overrides, [feature]: e.target.value as PermissionLevel } })
                    }
                  >
                    <option value="">From role pack</option>
                    <option value="NONE">No access</option>
                    <option value="READ">Read only</option>
                    <option value="EDIT">Read and edit</option>
                  </select>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold">Recent admin activity</h2>
      <ul className="mt-2 space-y-1 text-sm text-gray-600">
        {audits.map((a) => (
          <li key={a.id}>{a.actor.name}: {a.action} · {new Date(a.createdAt).toLocaleString()}</li>
        ))}
      </ul>
    </div>
  );
}
