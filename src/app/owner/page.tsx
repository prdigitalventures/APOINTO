'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useActiveBusiness } from '@/components/ActiveBusinessProvider';
import { AIChat } from '@/components/AIChat';
import { QrSticker } from '@/components/QrSticker';
import { Button } from '@/components/ui/Button';
import { Bell, ChevronRight, MapPin } from 'lucide-react';
import { formatBusinessCode, googleMapsSearchUrl } from '@/lib/place';
import { getCategoryDisplayName } from '@/lib/booking-schema';

export default function OwnerDashboard() {
  const { user, loading } = useAuth();
  const { businesses, active, setActiveId, refresh } = useActiveBusiness();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [completedBusiness, setCompletedBusiness] = useState<{ id: string; slug: string; name: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('onboarding') === '1') {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'OWNER') router.push('/customer');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetch('/api/notifications').then((r) => r.json()).then((d) => setUnreadCount(d.unreadCount || 0));
    }
  }, [user, completedBusiness]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (showOnboarding || completedBusiness) {
    return (
      <div className="min-h-screen flex flex-col max-w-lg mx-auto pb-32">
        <header className="flex items-center justify-between p-4 border-b bg-white">
          <h1 className="font-semibold">{completedBusiness ? 'Setup complete' : 'AI Business Builder'}</h1>
          <Button variant="ghost" size="sm" onClick={() => { setShowOnboarding(false); setCompletedBusiness(null); refresh(); }}>
            Close
          </Button>
        </header>
        {completedBusiness ? (
          <div className="p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold">Your booking system is ready</h2>
              <p className="text-gray-600 mt-2">{completedBusiness.name}</p>
            </div>
            <QrSticker slug={completedBusiness.slug} businessName={completedBusiness.name} />
            <Link href={`/owner/calendar?business=${completedBusiness.id}`}>
              <Button className="w-full" size="lg" onClick={() => setActiveId(completedBusiness.id)}>
                Open this shop calendar
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex-1">
            <AIChat onComplete={(biz) => { setCompletedBusiness(biz); setActiveId(biz.id); }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <header className="bg-white border-b px-4 py-4 flex items-center justify-between dark:bg-[#16181d] dark:border-gray-800">
        <div>
          <p className="text-sm text-gray-500">Welcome back</p>
          <h1 className="text-lg font-bold">{user.name}</h1>
        </div>
        <Link href="/owner/notifications" className="relative p-2">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {active ? (
          <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">Active shop</p>
            <h2 className="mt-1 text-lg font-semibold">{active.name}</h2>
            <p className="text-sm capitalize text-indigo-800 dark:text-indigo-200">
              {getCategoryDisplayName(active.category)}
              {active.uniqueCode ? ` · ${formatBusinessCode(active.uniqueCode)}` : ''}
            </p>
            {active.location ? (
              <a
                href={googleMapsSearchUrl(active.location)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-700"
              >
                <MapPin size={14} /> {active.location}
              </a>
            ) : null}
            <div className="mt-3 flex gap-2">
              <Link href={`/owner/calendar?business=${active.id}`} className="flex-1">
                <Button className="w-full" size="sm">Calendar</Button>
              </Link>
              <Link href={`/${active.slug}`} className="flex-1">
                <Button variant="outline" className="w-full" size="sm">Public profile</Button>
              </Link>
            </div>
          </section>
        ) : null}

        <button
          onClick={() => setShowOnboarding(true)}
          className="w-full bg-white rounded-2xl border-2 border-indigo-200 p-4 text-left hover:border-indigo-400 dark:bg-[#16181d]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold">+</div>
            <div className="flex-1">
              <p className="font-medium">Add another booking system</p>
              <p className="text-sm text-gray-500">Salon, spa, clinic, legal — switch between them here</p>
            </div>
            <ChevronRight className="text-gray-400" />
          </div>
        </button>

        {businesses.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Your businesses</h2>
            <p className="mb-3 text-sm text-gray-500">Tap to switch. Calendar, CRM, and profile follow this shop.</p>
            <div className="space-y-3">
              {businesses.map((biz) => (
                <button
                  key={biz.id}
                  type="button"
                  onClick={() => setActiveId(biz.id)}
                  className={`w-full rounded-2xl border p-4 text-left ${
                    biz.id === active?.id
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                      : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-[#16181d]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold">{biz.name}</h3>
                      <p className="text-sm capitalize text-gray-500">
                        {getCategoryDisplayName(biz.category)} · {biz._count?.bookings || 0} bookings
                      </p>
                      {biz.uniqueCode ? (
                        <p className="mt-1 font-mono text-xs">{formatBusinessCode(biz.uniqueCode)}</p>
                      ) : null}
                      {biz.location ? (
                        <a
                          href={googleMapsSearchUrl(biz.location)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-700"
                        >
                          <MapPin size={12} /> {biz.location}
                        </a>
                      ) : null}
                    </div>
                    {biz.id === active?.id ? (
                      <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] text-white">Active</span>
                    ) : (
                      <span className="text-xs text-indigo-700">Switch</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
