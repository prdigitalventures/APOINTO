'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { TimeRequestButtons } from '@/components/TimeRequestButtons';
import { formatTime12h, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

interface BookingDetail {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  customerName: string;
  service: { name: string; price: number };
  staff: { name: string } | null;
  business: { name: string; slug: string; location: string | null };
}

export default function BookingDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/bookings/${params.id}`)
        .then((r) => r.json())
        .then((d) => setBooking(d.booking));
    }
  }, [params.id]);

  const handleAction = async (action: string, extra?: Record<string, unknown>) => {
    if (!booking) return;
    setActionLoading(true);
    try {
      await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const res = await fetch(`/api/bookings/${booking.id}`);
      const data = await res.json();
      setBooking(data.booking);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !booking) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href="/customer/bookings"><ArrowLeft size={20} /></Link>
        <h1 className="font-semibold">Booking Details</h1>
      </header>

      <div className="p-4 space-y-6">
        <div className="bg-white rounded-2xl border p-6 text-center">
          <StatusChip status={booking.status} />
          <h2 className="text-xl font-bold mt-3">{booking.business.name}</h2>
          <p className="text-gray-600 mt-1">
            {booking.service.name}
            {booking.staff && ` with ${booking.staff.name}`}
          </p>
          <p className="text-lg font-semibold text-indigo-600 mt-2">
            {format(new Date(booking.date), 'EEE, MMM d')} · {formatTime12h(booking.startTime)}
          </p>
          <p className="text-sm text-gray-500 mt-1">{formatCurrency(booking.service.price)}</p>
        </div>

        {booking.status === 'PENDING' && (
          <div className="bg-yellow-50 rounded-2xl p-4 text-center">
            <p className="font-medium">Waiting for business confirmation</p>
            <p className="text-sm text-gray-600 mt-1">You&apos;ll be notified once confirmed</p>
          </div>
        )}

        {booking.status === 'CONFIRMED' && (
          <div className="space-y-4">
            <TimeRequestButtons
              onSelect={(min) => handleAction('request_time', { additionalMinutes: min, requestedBy: 'customer' })}
              loading={actionLoading}
            />
            <Button variant="outline" className="w-full" onClick={() => handleAction('cancel')}>
              Cancel Booking
            </Button>
          </div>
        )}

        {booking.status === 'RESCHEDULE_REQUESTED' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">The business suggested an alternative time.</p>
            <Button className="w-full" onClick={() => handleAction('accept_suggested_time')}>Accept Suggested Time</Button>
            <Button variant="outline" className="w-full">Choose Another Time</Button>
          </div>
        )}

        {(booking.status === 'TIME_UPDATE_REQUESTED' || booking.status === 'DELAYED') && (
          <div className="bg-orange-50 rounded-2xl p-4">
            <p className="font-medium">⏱️ Time update</p>
            <p className="text-sm text-gray-600 mt-1">Updated time: {formatTime12h(booking.startTime)}</p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={() => handleAction('accept_time_request')}>Accept</Button>
              <Button size="sm" variant="outline">Choose Another Time</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
