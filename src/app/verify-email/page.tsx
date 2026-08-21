'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/Button';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuth();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'working' | 'ok' | 'error'>(token ? 'working' : 'error');
  const [message, setMessage] = useState(token ? 'Verifying your email…' : 'This verification link is missing a token.');

  useEffect(() => {
    if (!token) return;
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setStatus('ok');
        setMessage('Your email is verified. You can now book appointments.');
        await refresh();
        setTimeout(() => router.push('/customer'), 1200);
      })
      .catch((err: Error) => {
        setStatus('error');
        setMessage(err.message);
      });
  }, [token, refresh, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Email verification</h1>
        <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>{message}</p>
        {status !== 'working' && (
          <Link href="/login" className="inline-block mt-6">
            <Button>Continue</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
