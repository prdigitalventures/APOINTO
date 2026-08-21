'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GoogleButton, RequiredMark } from '@/components/AuthFields';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const role = searchParams.get('role') === 'owner' ? 'OWNER' : 'CUSTOMER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ name, email, phone, password, role });
      router.push(role === 'OWNER' ? '/owner' : '/customer');
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
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-600 mt-2">
            {role === 'OWNER' ? 'Set up your business booking system' : 'Book appointments easily'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">{error}</div>}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Name <RequiredMark />
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Email <RequiredMark />
            </label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Phone <RequiredMark />
            </label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91 98765 43210" type="tel" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Password <RequiredMark />
            </label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" placeholder="••••••••" minLength={6} />
          </div>
          <p className="text-xs text-gray-500">
            We will email you a verification link. Phone OTP is not used. You can browse availability before verifying, but booking requires a verified email.
          </p>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">or</span></div>
          </div>
          <GoogleButton role={role} label="Sign up with Google" />
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account? <Link href="/login" className="text-indigo-600 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
