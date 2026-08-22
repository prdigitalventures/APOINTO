'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useActiveBusiness } from '@/components/ActiveBusinessProvider';
import { OwnerSubpageFrame } from '@/components/owner/OwnerSubpageFrame';
import { BusinessDetailsForm } from '@/components/profile/BusinessDetailsForm';
import { Button } from '@/components/ui/Button';
import { readMediaFile } from '@/lib/read-media-file';

type MediaRow = { id: string; kind: string; data: string; caption: string | null };

export default function OwnerListingPage() {
  const { active, loaded } = useActiveBusiness();
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = () => {
    if (!active?.id) return;
    fetch(`/api/owner/listing/media?businessId=${active.id}`)
      .then((r) => r.json())
      .then((d) => setMedia(d.media || []));
  };

  useEffect(() => {
    if (!loaded) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, loaded]);

  const onFile = async (file?: File) => {
    if (!file || !active?.id) return;
    setUploading(true);
    setError('');
    try {
      const parsed = await readMediaFile(file);
      const res = await fetch('/api/owner/listing/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: active.id, ...parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not upload');
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/owner/listing/media/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  return (
    <OwnerSubpageFrame title="Listing" subtitle="Edit shop details and showcase photos or videos">
      <div className="space-y-4 px-4">
        {active ? (
          <Link href={`/${active.slug}`}>
            <Button variant="outline" className="w-full">
              View public page
            </Button>
          </Link>
        ) : null}

        <section className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-[#16181d]">
          <h2 className="font-semibold">Showcase gallery</h2>
          <p className="mb-3 text-xs text-gray-500">Photos and short videos customers see on your listing.</p>
          <label className="inline-flex cursor-pointer rounded-xl bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700">
            {uploading ? 'Uploading...' : 'Upload photo or video'}
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {media.map((item) => (
              <figure key={item.id} className="overflow-hidden rounded-xl bg-gray-100">
                {item.kind === 'VIDEO' ? (
                  <video src={item.data} controls className="h-32 w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.data} alt="" className="h-32 w-full object-cover" />
                )}
                <button type="button" className="w-full py-1 text-xs text-red-600" onClick={() => remove(item.id)}>
                  Remove
                </button>
              </figure>
            ))}
          </div>
        </section>
      </div>
      <BusinessDetailsForm embedded />
    </OwnerSubpageFrame>
  );
}
