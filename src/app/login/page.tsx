'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GoogleButton } from '@/components/AuthFields';
import { OWNER_ONBOARDING_PATH, parseAuthIntentRole } from '@/lib/auth-intent';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(searchParams.get('error') || '');
  const [loading, setLoading] = useState(false);
  const role = parseAuthIntentRole(searchParams.get('role'));
  const isOwner = role === 'OWNER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
      router.push('/');
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
          <h1 className="text-2xl font-bold text-gray-900">
            {isOwner ? 'Owner login' : 'Welcome back'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isOwner ? 'Manage or create your booking system' : 'Log in to your Apointo account'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">{error}</div>}
          <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-sm">
            <Link
              href="/login?role=customer"
              className={`rounded-lg px-3 py-2 text-center font-medium ${!isOwner ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'}`}
            >
              Customer
            </Link>
            <Link
              href="/login?role=owner"
              className={`rounded-lg px-3 py-2 text-center font-medium ${isOwner ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'}`}
            >
              Business owner
            </Link>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Phone or email</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="Phone or email" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" placeholder="••••••••" />
          </div>
          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-indigo-600 font-medium">Forgot password?</Link>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </Button>
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">or</span></div>
          </div>
          <GoogleButton
            role={role}
            next={isOwner ? OWNER_ONBOARDING_PATH : '/customer'}
            label="Continue with Google"
          />
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Don&apos;t have an account?{' '}
          <Link href={`/register?role=${isOwner ? 'owner' : 'customer'}`} className="text-indigo-600 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
