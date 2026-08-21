'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/Button';

export function AccountPage({ expectedRole }: { expectedRole: 'OWNER' | 'CUSTOMER' }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== expectedRole) {
      router.push(user.role === 'OWNER' ? '/owner' : '/customer');
    }
  }, [expectedRole, loading, router, user]);

  if (loading || !user || user.role !== expectedRole) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const signOut = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="border-b bg-white px-4 py-4">
        <div className="mx-auto max-w-lg">
          <h1 className="font-semibold">Profile</h1>
          <p className="text-xs text-gray-500">Account settings</p>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-5 p-4">
        <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <UserRound size={26} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{user.name}</h2>
              <p className="flex items-center gap-1 text-sm text-indigo-700">
                <ShieldCheck size={15} />
                {expectedRole === 'OWNER' ? 'Business owner' : 'Customer'}
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-white">
          <div className="flex items-center gap-3 border-b p-4">
            <Phone size={18} className="text-indigo-600" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium">{user.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Mail size={18} className="text-indigo-600" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Email</p>
              <p className="truncate text-sm font-medium">{user.email || 'Not added'}</p>
            </div>
          </div>
        </section>

        <Button variant="outline" className="w-full" onClick={signOut}>
          <LogOut size={17} className="mr-2" />
          Sign out
        </Button>
      </main>
    </div>
  );
}
