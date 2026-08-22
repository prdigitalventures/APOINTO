'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/AuthProvider';
import { ProfileSubpage } from '@/components/profile/ProfileSubpage';

export function FeedbackForm({ role }: { role: 'OWNER' | 'CUSTOMER' }) {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const base = role === 'OWNER' ? '/owner/profile' : '/customer/profile';
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) router.push('/login');
    else if (user.role !== role) router.push(user.role === 'OWNER' ? '/owner' : '/customer');
  }, [loading, role, router, user]);

  if (loading || !user || user.role !== role) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, rating }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send');
      await refresh();
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileSubpage title="Share feedback" subtitle="Tell us how to improve Apointo" backHref={base}>
      {done ? (
        <p className="text-sm text-emerald-600">
          Thanks — we read every note. You earned 10 coins. You can also email apointosupport@pozer.co.in.
        </p>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-[#16181d]">
          <p className="mb-2 text-xs text-gray-500">How is the app today?</p>
          <div className="mb-4 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`h-10 w-10 rounded-xl text-sm font-semibold ${
                  rating >= n ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="What should we fix or add?"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base dark:border-gray-700 dark:bg-[#0b0d12]"
          />
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <Button className="mt-4 w-full" onClick={submit} disabled={saving}>
            {saving ? 'Sending...' : 'Send feedback'}
          </Button>
        </div>
      )}
    </ProfileSubpage>
  );
}
