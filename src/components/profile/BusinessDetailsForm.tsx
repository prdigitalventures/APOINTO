'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/components/AuthProvider';
import { useActiveBusiness } from '@/components/ActiveBusinessProvider';
import { ProfileSubpage } from '@/components/profile/ProfileSubpage';
import { compressImage } from '@/components/profile/compressImage';
import { QrSticker } from '@/components/QrSticker';
import { formatBusinessCode, googleMapsSearchUrl } from '@/lib/place';

interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  location: string | null;
  description: string | null;
  about: string | null;
  logo: string | null;
  uniqueCode?: string | null;
  contactPhone?: string | null;
}

export function BusinessDetailsForm() {
  const { user, loading } = useAuth();
  const { businesses, active, setActiveId, refresh } = useActiveBusiness();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
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
    if (!active) {
      setBusiness(null);
      return;
    }
    setBusiness({
      id: active.id,
      name: active.name,
      slug: active.slug,
      category: active.category,
      location: active.location,
      description: active.description,
      about: active.about,
      logo: active.logo,
      uniqueCode: active.uniqueCode,
      contactPhone: active.contactPhone,
    });
  }, [active]);

  if (loading || !user || user.role !== 'OWNER') {
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
      setBusiness({ ...business, ...data.business });
      await refresh();
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
      subtitle="Photo, address, Maps link, and QR sticker"
      backHref="/owner/profile"
    >
      {businesses.length > 1 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Your businesses</p>
          {businesses.map((biz) => (
            <button
              key={biz.id}
              type="button"
              onClick={() => setActiveId(biz.id)}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                biz.id === business.id
                  ? 'border-indigo-400 bg-indigo-50 font-medium dark:bg-indigo-950'
                  : 'border-gray-100 dark:border-gray-800'
              }`}
            >
              {biz.name}
              <span className="ml-2 text-xs capitalize text-gray-500">{biz.category}</span>
            </button>
          ))}
        </div>
      ) : null}

      {business.uniqueCode ? (
        <p className="rounded-xl bg-gray-100 px-3 py-2 text-center font-mono text-sm font-semibold dark:bg-gray-800">
          {formatBusinessCode(business.uniqueCode)}
        </p>
      ) : null}

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
            <label className="mb-1 block text-xs text-gray-500">Location / address</label>
            <Input
              value={business.location || ''}
              onChange={(e) => setBusiness({ ...business, location: e.target.value })}
              placeholder="Street, area, city"
            />
            {business.location ? (
              <a
                href={googleMapsSearchUrl(business.location)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-700"
              >
                <MapPin size={14} /> Open in Google Maps
              </a>
            ) : null}
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
        <p className="mt-3 text-center text-xs text-gray-500">Public page: /{business.slug}</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-[#16181d]">
        <h2 className="mb-3 text-sm font-semibold">QR sticker</h2>
        <p className="mb-3 text-xs text-gray-500">
          Download and stick this at the shop. Scanning opens the booking profile.
        </p>
        <QrSticker
          slug={business.slug}
          businessName={business.name}
          phone={business.contactPhone}
          address={business.location}
          uniqueCode={business.uniqueCode}
          category={business.category}
        />
      </div>
    </ProfileSubpage>
  );
}
