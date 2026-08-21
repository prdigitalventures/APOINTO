'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/components/AuthProvider';
import { ProfileSubpage } from '@/components/profile/ProfileSubpage';
import { compressImage } from '@/components/profile/compressImage';

interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  location: string | null;
  description: string | null;
  about: string | null;
  logo: string | null;
}

export function BusinessDetailsForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'OWNER') router.push('/customer');
  }, [loading, router, user]);

  useEffect(() => {
    if (!user || user.role !== 'OWNER') return;
    fetch('/api/businesses')
      .then((r) => r.json())
      .then((d) => {
        setBusiness(d.businesses?.[0] || null);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [user]);

  if (loading || !user || user.role !== 'OWNER' || !ready) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!business) {
    return (
      <ProfileSubpage title="Business details" subtitle="Complete your listing" backHref="/owner/profile">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          You have not created a booking system yet. Finish AI setup to add photos, location, and about text.
        </p>
        <Link href="/owner?onboarding=1">
          <Button className="w-full">Create my booking system</Button>
        </Link>
      </ProfileSubpage>
    );
  }

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      setBusiness({ ...business, logo: await compressImage(file) });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/owner/businesses/${business.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(business),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save');
      setBusiness(data.business);
      setMessage('Business details saved. Customers will see this on your booking page.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileSubpage
      title="Business details"
      subtitle="Photo, address, and how customers find you"
      backHref="/owner/profile"
    >
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-[#16181d]">
        <label className="flex cursor-pointer flex-col items-center gap-3">
          <div className="h-24 w-24 overflow-hidden rounded-2xl bg-indigo-100 dark:bg-indigo-950">
            {business.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logo} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center px-2 text-center text-xs font-medium text-indigo-700">
                Shop photo
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-indigo-600">Upload business photo</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <div className="mt-5 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Business name</label>
            <Input value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Category</label>
            <Input value={business.category} onChange={(e) => setBusiness({ ...business, category: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Location / area</label>
            <Input
              value={business.location || ''}
              onChange={(e) => setBusiness({ ...business, location: e.target.value })}
              placeholder="Koramangala, Bangalore"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Short description</label>
            <Input
              value={business.description || ''}
              onChange={(e) => setBusiness({ ...business, description: e.target.value })}
              placeholder="What customers should know"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">About</label>
            <textarea
              value={business.about || ''}
              onChange={(e) => setBusiness({ ...business, about: e.target.value })}
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base dark:border-gray-700 dark:bg-[#0b0d12]"
            />
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-emerald-600">{message}</p> : null}
        <Button className="mt-5 w-full" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save business details'}
        </Button>
        <p className="mt-3 text-center text-xs text-gray-500">
          Public page: /{business.slug}
        </p>
      </div>
    </ProfileSubpage>
  );
}
