'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { formatTime12h } from '@/lib/utils';
import { format, isToday, isTomorrow } from 'date-fns';
import { Search, LogOut, Calendar } from 'lucide-react';
import { CATEGORIES } from '@/lib/utils';

interface Booking {
  id: string;
  date: string;
  startTime: string;
  status: string;
  service: { name: string };
  staff: { name: string } | null;
  business: { name: string; slug: string; category: string };
}

export default function CustomerHome() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role === 'OWNER') router.push('/owner');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetch('/api/bookings').then((r) => r.json()).then((d) => setBookings(d.bookings || []));
    }
  }, [user]);

  const formatDate = (dateStr: string, time: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return `Today · ${formatTime12h(time)}`;
    if (isTomorrow(date)) return `Tomorrow · ${formatTime12h(time)}`;
    return `${format(date, 'EEE, MMM d')} · ${formatTime12h(time)}`;
  };

  const pastBusinesses = Array.from(new Map(bookings.map((b) => [b.business.slug, b.business])).values());

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-500">Hi, {user.name.split(' ')[0]} 👋</p>
            <h1 className="text-xl font-bold">What do you want to book?</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}><LogOut size={18} /></Button>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            className="w-full bg-gray-100 rounded-2xl pl-11 pr-4 py-3.5 text-sm"
            placeholder='🔍 "Book a haircut tomorrow at 6 PM"'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <main className="px-4 space-y-6">
        {bookings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Upcoming</h2>
              <Link href="/customer/bookings" className="text-sm text-indigo-600">View all</Link>
            </div>
            <div className="space-y-3">
              {bookings.slice(0, 3).map((booking) => (
                <Link key={booking.id} href={`/customer/bookings/${booking.id}`}>
                  <div className="bg-white rounded-2xl border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{booking.business.name}</h3>
                        <p className="text-sm text-gray-600">
                          {booking.service.name}
                          {booking.staff && ` with ${booking.staff.name}`}
                        </p>
                        <p className="text-sm text-indigo-600 mt-1">{formatDate(booking.date, booking.startTime)}</p>
                      </div>
                      <StatusChip status={booking.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {pastBusinesses.length > 0 && (
          <section>
            <h2 className="font-semibold mb-3">Book Again</h2>
            <div className="space-y-3">
              {pastBusinesses.map((biz) => (
                <div key={biz.slug} className="bg-white rounded-2xl border p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{biz.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{biz.category}</p>
                  </div>
                  <Link href={`/${biz.slug}/book`}>
                    <Button size="sm">Book Again</Button>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-semibold mb-3">Explore</h2>
          <div className="grid grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="bg-white rounded-xl border p-3 text-center">
                <div className="text-2xl mb-1">{cat.icon}</div>
                <p className="text-xs text-gray-600">{cat.name}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t safe-bottom">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          <Link href="/customer" className="flex flex-col items-center p-2 text-indigo-600">
            <Calendar size={20} />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/customer/bookings" className="flex flex-col items-center p-2 text-gray-500">
            <Calendar size={20} />
            <span className="text-xs mt-1">Bookings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
