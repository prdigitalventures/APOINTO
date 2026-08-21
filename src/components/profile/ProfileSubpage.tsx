'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export function ProfileSubpage({
  title,
  subtitle,
  backHref,
  children,
}: {
  title: string;
  subtitle?: string;
  backHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-24">
      <header className="border-b border-gray-100 bg-white px-4 py-4 dark:border-gray-800 dark:bg-[#16181d]">
        <div className="mx-auto max-w-lg">
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400"
          >
            <ChevronLeft size={16} />
            Profile
          </Link>
          <h1 className="font-semibold">{title}</h1>
          {subtitle ? <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p> : null}
        </div>
      </header>
      <main className="mx-auto max-w-lg space-y-5 p-4">{children}</main>
    </div>
  );
}

export function MenuCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-[#16181d]">
      {children}
    </section>
  );
}
