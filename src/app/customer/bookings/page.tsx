'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { StatusChip } from '@/components/ui/StatusChip';
import { formatTime12h } from '@/lib/utils';
import { format, isToday, isTomorrow } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

interface Booking {
  id: string;
  date: string;
  startTime: string;
  status: string;
  service: { name: string };
  staff: { name: string } | null;
  business: { name: string; slug: string };
}

export default function CustomerBookingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
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

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href="/customer"><ArrowLeft size={20} /></Link>
        <h1 className="font-semibold">My Bookings</h1>
      </header>
      <div className="p-4 space-y-3">
        {bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No upcoming bookings</div>
        ) : (
          bookings.map((booking) => (
            <Link key={booking.id} href={`/customer/bookings/${booking.id}`}>
              <div className="bg-white rounded-2xl border p-4 mb-3">
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
          ))
        )}
      </div>
    </div>
  );
}
