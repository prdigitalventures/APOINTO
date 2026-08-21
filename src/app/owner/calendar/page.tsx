'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { TimeRequestButtons } from '@/components/TimeRequestButtons';
import { ShareLink } from '@/components/ShareLink';
import { formatTime12h, formatCurrency, DAYS } from '@/lib/utils';
import { format, isToday } from 'date-fns';
import { ArrowLeft, Plus, Clock } from 'lucide-react';

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  isWalkIn: boolean;
  createdAt?: string;
  service: { name: string; price: number };
  staff: { name: string } | null;
}

function CalendarContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = searchParams.get('business');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [business, setBusiness] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    fetch('/api/businesses')
      .then((r) => r.json())
      .then((d) => {
        const businesses = (d.businesses || []) as Array<{ id: string; name: string; slug: string }>;
        const biz = businessId
          ? businesses.find((item) => item.id === businessId)
          : businesses[0];

        if (biz) {
          setBusiness(biz);
          if (!businessId) {
            router.replace(`/owner/calendar?business=${biz.id}`);
          }
        }
      });
  }, [businessId, router, user]);

  useEffect(() => {
    if (!businessId) return;

    fetch(`/api/bookings?businessId=${businessId}&role=owner`)
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings || []));
  }, [businessId]);

  const dayKey = (value: Date | string) => format(new Date(value), 'yyyy-MM-dd');

  const dayBookings = bookings.filter((b) => dayKey(b.date) === dayKey(selectedDate));

  const activeOnDay = (key: string) =>
    bookings.filter(
      (b) =>
        dayKey(b.date) === key &&
        !['CANCELLED', 'REJECTED'].includes(b.status)
    );

  const hasNewAlert = (dayList: Booking[]) =>
    dayList.some((b) =>
      ['PENDING', 'TIME_UPDATE_REQUESTED', 'CUSTOMER_TIME_REQUESTED'].includes(b.status)
    );

  const handleAction = async (bookingId: string, action: string, extra?: Record<string, unknown>) => {
    setActionLoading(bookingId);
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const res = await fetch(`/api/bookings?businessId=${businessId}&role=owner`);
      const data = await res.json();
      setBookings(data.bookings || []);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href="/owner"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-semibold">{business?.name || 'Calendar'}</h1>
          <p className="text-xs text-gray-500">
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEE, MMM d')}
            {dayBookings.length
              ? ` · ${dayBookings.length} booking${dayBookings.length === 1 ? '' : 's'}`
              : ''}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowShare(!showShare)}>Share</Button>
      </header>

      {showShare && business && (
        <div className="bg-white border-b p-4">
          <ShareLink slug={business.slug} businessName={business.name} />
        </div>
      )}

      <div className="px-4 py-3 flex gap-2 overflow-x-auto">
        {[-1, 0, 1, 2, 3, 4, 5, 6].map((offset) => {
          const d = new Date();
          d.setDate(d.getDate() + offset);
          const key = dayKey(d);
          const isSelected = key === dayKey(selectedDate);
          const onDay = activeOnDay(key);
          const alert = hasNewAlert(onDay);
          return (
            <button
              key={offset}
              type="button"
              onClick={() => setSelectedDate(d)}
              aria-label={`${DAYS[d.getDay()]} ${d.getDate()}${
                onDay.length ? `, ${onDay.length} booking${onDay.length === 1 ? '' : 's'}` : ', no bookings'
              }${alert ? ', new booking alert' : ''}`}
              className={`relative flex-shrink-0 w-14 py-2 rounded-xl text-center ${
                isSelected ? 'bg-indigo-600 text-white' : 'bg-white border dark:bg-[#16181d] dark:border-gray-700'
              }`}
            >
              {alert ? (
                <span
                  className="apointo-alert-dot absolute right-1.5 top-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white"
                  title="New booking alert"
                />
              ) : null}
              <div className="text-xs">{DAYS[d.getDay()].slice(0, 3)}</div>
              <div className="text-lg font-semibold leading-tight">{d.getDate()}</div>
              <div className="mt-0.5 flex h-3 items-center justify-center gap-0.5">
                {onDay.length > 0 ? (
                  <>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`}
                    />
                    <span className={`text-[10px] font-medium ${isSelected ? 'text-indigo-100' : 'text-indigo-600'}`}>
                      {onDay.length}
                    </span>
                  </>
                ) : (
                  <span className="h-1.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="px-4 flex gap-2 mb-4">
        <Button size="sm" variant="outline" onClick={() => setShowWalkIn(true)}>
          <Plus size={16} className="mr-1" /> Walk-in
        </Button>
      </div>

      <div className="px-4 space-y-3">
        {dayBookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="mx-auto mb-2 opacity-50" />
            <p>No bookings for this day</p>
          </div>
        ) : (
          dayBookings
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatTime12h(booking.startTime)}</span>
                      <StatusChip status={booking.status} />
                      {booking.isWalkIn && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Walk-in</span>}
                    </div>
                    <p className="text-sm text-gray-900 mt-1">{booking.customerName}</p>
                    <p className="text-sm text-gray-500">
                      {booking.service.name}
                      {booking.staff && ` · ${booking.staff.name}`}
                      {' · '}{formatCurrency(booking.service.price)}
                    </p>
                  </div>
                </div>

                {booking.status === 'PENDING' && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => handleAction(booking.id, 'accept')} disabled={actionLoading === booking.id}>
                      Accept
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleAction(booking.id, 'reject', { rejectionReasonId: 'not_available' })} disabled={actionLoading === booking.id}>
                      Reject
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(booking.id, 'suggest_time', { suggestedTime: '16:00' })} disabled={actionLoading === booking.id}>
                      Suggest Time
                    </Button>
                  </div>
                )}

                {booking.status === 'CONFIRMED' && (
                  <div className="mt-3 space-y-2">
                    <TimeRequestButtons onSelect={(min) => handleAction(booking.id, 'request_time', { additionalMinutes: min, requestedBy: 'owner' })} loading={actionLoading === booking.id} />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleAction(booking.id, 'running_late', { additionalMinutes: 15 })}>Running Late</Button>
                      <Button size="sm" variant="secondary" onClick={() => handleAction(booking.id, 'complete')}>Complete</Button>
                    </div>
                  </div>
                )}

                {(booking.status === 'TIME_UPDATE_REQUESTED' || booking.status === 'CUSTOMER_TIME_REQUESTED') && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => handleAction(booking.id, 'accept_time_request')}>Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(booking.id, 'reject')}>Reject</Button>
                  </div>
                )}
              </div>
            ))
        )}
      </div>

      {showWalkIn && businessId && (
        <WalkInModal
          businessId={businessId}
          date={selectedDate}
          onClose={() => setShowWalkIn(false)}
          onSuccess={() => {
            setShowWalkIn(false);
            fetch(`/api/bookings?businessId=${businessId}&role=owner`)
              .then((r) => r.json())
              .then((d) => setBookings(d.bookings || []));
          }}
        />
      )}
    </div>
  );
}

function WalkInModal({ businessId, date, onClose, onSuccess }: {
  businessId: string; date: Date; onClose: () => void; onSuccess: () => void;
}) {
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([]);
  const [staff, setStaff] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', serviceId: '', staffId: '', startTime: '10:00' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/businesses').then((r) => r.json()).then((d) => {
      const biz = d.businesses?.find((b: { id: string }) => b.id === businessId);
      if (biz) {
        setServices(biz.services || []);
        setStaff(biz.staff || []);
      }
    });
  }, [businessId]);

  const submit = async () => {
    setLoading(true);
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, businessId, date: date.toISOString(), isWalkIn: true }),
      });
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Add Walk-in Customer</h2>
        <input className="w-full border rounded-xl px-4 py-3" placeholder="Customer name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
        <input className="w-full border rounded-xl px-4 py-3" placeholder="Phone" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
        <select className="w-full border rounded-xl px-4 py-3" value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}>
          <option value="">Select service</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="w-full border rounded-xl px-4 py-3" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}>
          <option value="">Select staff</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="time" className="w-full border rounded-xl px-4 py-3" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={submit} disabled={loading || !form.customerName || !form.serviceId}>Add</Button>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CalendarContent />
    </Suspense>
  );
}
