'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RequiredMark } from '@/components/AuthFields';
import { useAuth } from '@/components/AuthProvider';

export default function CompleteGooglePage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/google/complete')
      .then((r) => r.json())
      .then((d) => {
        if (d.pending?.name) setName(d.pending.name);
        if (!d.pending) setError('Google sign-up expired. Please start again.');
      })
      .catch(() => setError('Could not load your Google sign-up. Please start again.'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refresh();
      router.push(data.next || (data.user?.role === 'OWNER' ? '/owner' : '/customer'));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Finish Google sign-up</h1>
          <p className="text-gray-600 mt-2">Add your phone number so we can keep your account unique.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">{error}</div>}
          <div>
            <label className="text-sm font-medium text-gray-700">Name <RequiredMark /></label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Phone <RequiredMark /></label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} required type="tel" placeholder="+91 98765 43210" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Complete account'}
          </Button>
        </form>
      </div>
    </div>
  );
}
