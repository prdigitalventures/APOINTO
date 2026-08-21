'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { AIChat } from '@/components/AIChat';
import { ShareLink } from '@/components/ShareLink';
import { Button } from '@/components/ui/Button';
import { Bell, LogOut, ChevronRight } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  _count: { bookings: number };
}

export default function OwnerDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
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
      fetch('/api/businesses').then((r) => r.json()).then((d) => setBusinesses(d.businesses || []));
      fetch('/api/notifications').then((r) => r.json()).then((d) => setUnreadCount(d.unreadCount || 0));
    }
  }, [user, completedBusiness]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (showOnboarding || completedBusiness) {
    return (
      <div className="min-h-screen flex flex-col max-w-lg mx-auto">
        <header className="flex items-center justify-between p-4 border-b bg-white">
          <h1 className="font-semibold">{completedBusiness ? '✅ Setup Complete' : 'AI Business Builder'}</h1>
          <Button variant="ghost" size="sm" onClick={() => { setShowOnboarding(false); setCompletedBusiness(null); }}>
            Close
          </Button>
        </header>
        {completedBusiness ? (
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-xl font-bold">Your booking system is ready!</h2>
              <p className="text-gray-600 mt-2">{completedBusiness.name}</p>
            </div>
            <ShareLink slug={completedBusiness.slug} businessName={completedBusiness.name} />
            <Link href={`/owner/calendar?business=${completedBusiness.id}`}>
              <Button className="w-full" size="lg">View Dashboard</Button>
            </Link>
          </div>
        ) : (
          <div className="flex-1">
            <AIChat onComplete={(biz) => setCompletedBusiness(biz)} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-white border-b px-4 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Welcome back</p>
          <h1 className="text-lg font-bold">{user.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/owner/notifications" className="relative p-2">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
          <Button variant="ghost" size="sm" onClick={logout}><LogOut size={18} /></Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-3">What would you like to do?</h2>
          <button
            onClick={() => setShowOnboarding(true)}
            className="w-full bg-white rounded-2xl border-2 border-indigo-200 p-4 text-left hover:border-indigo-400 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">✨</div>
              <div className="flex-1">
                <p className="font-medium">Create my booking system</p>
                <p className="text-sm text-gray-500">AI-guided setup in minutes</p>
              </div>
              <ChevronRight className="text-gray-400" />
            </div>
          </button>
        </section>

        {businesses.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Your Businesses</h2>
            <div className="space-y-3">
              {businesses.map((biz) => (
                <Link key={biz.id} href={`/owner/calendar?business=${biz.id}`}>
                  <div className="bg-white rounded-2xl border p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{biz.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{biz.category} · {biz._count.bookings} bookings</p>
                      </div>
                      <ChevronRight className="text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

    </div>
  );
}
