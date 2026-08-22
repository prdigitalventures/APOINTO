'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export function OwnerSubpageFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'OWNER') router.push('/customer');
  }, [loading, router, user]);

  if (loading || !user || user.role !== 'OWNER') {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen pb-32">
      <header className="border-b border-gray-100 bg-white px-4 py-4 dark:border-gray-800 dark:bg-[#16181d]">
        <div className="mx-auto max-w-5xl">
          <Link href="/owner" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
            <ChevronLeft size={16} />
            Home
          </Link>
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">{title}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl py-4">{children}</main>
    </div>
  );
}
