'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/components/AuthProvider';
import { ProfileSubpage } from '@/components/profile/ProfileSubpage';
import { compressImage } from '@/components/profile/compressImage';

export function AccountDetailsForm({ role }: { role: 'OWNER' | 'CUSTOMER' }) {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const base = role === 'OWNER' ? '/owner/profile' : '/customer/profile';
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== role) router.push(user.role === 'OWNER' ? '/owner' : '/customer');
  }, [loading, role, router, user]);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setAvatar(user.avatar || null);
  }, [user]);

  if (loading || !user || user.role !== role) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const onFile = async (file?: File) => {
    if (!file) return;
    setError('');
    try {
      setAvatar(await compressImage(file));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save');
      await refresh();
      setMessage(
        !user.avatar && avatar
          ? 'Saved. You earned 25 Apointo coins for adding a photo.'
          : 'Account details saved.'
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileSubpage title="Account" subtitle="Your photo and personal details" backHref={base}>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-[#16181d]">
        <label className="flex cursor-pointer flex-col items-center gap-3">
          <div className="h-24 w-24 overflow-hidden rounded-2xl bg-indigo-100 dark:bg-indigo-950">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-medium text-indigo-700">
                Add photo
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-indigo-600">Upload profile photo</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
        <div className="mt-5 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Full name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Phone</label>
            <Input value={user.phone} disabled />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Email</label>
            <Input value={user.email || ''} disabled />
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-emerald-600">{message}</p> : null}
        <Button className="mt-5 w-full" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save account'}
        </Button>
      </div>
    </ProfileSubpage>
  );
}
