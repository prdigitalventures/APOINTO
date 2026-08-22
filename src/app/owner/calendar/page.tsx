'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useActiveBusiness } from '@/components/ActiveBusinessProvider';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { TimeRequestButtons } from '@/components/TimeRequestButtons';
import { ShareLink } from '@/components/ShareLink';
import { formatTime12h, formatCurrency, DAYS } from '@/lib/utils';
import {
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { BookingReceiptModal } from '@/components/BookingReceipt';
import { toReceiptView, type ReceiptView } from '@/lib/receipt-format';

const WEEK_STARTS_ON = 1 as const; // Monday — ISO / India
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const HORIZON_YEARS = 5;

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
  receiptNumber?: string | null;
  paidAt?: string | null;
  paymentMode?: string | null;
  service: { name: string; price: number };
  staff: { name: string } | null;
  business?: { name: string; location: string | null };
}

function CalendarContent() {
  const { user, loading } = useAuth();
  const { active, loaded: businessesLoaded } = useActiveBusiness();
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = searchParams.get('business') || active?.id || null;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [business, setBusiness] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptView | null>(null);
  const [payModeById, setPayModeById] = useState<Record<string, string>>({});

  const today = useMemo(() => new Date(), []);
  const minJumpMonth = startOfMonth(today);
  const maxJumpMonth = startOfMonth(addYears(today, HORIZON_YEARS));
  const jumpYears = useMemo(() => {
    const years: number[] = [];
    for (let y = minJumpMonth.getFullYear(); y <= maxJumpMonth.getFullYear(); y += 1) {
      years.push(y);
    }
    return years;
  }, [minJumpMonth, maxJumpMonth]);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !businessesLoaded) return;
    if (active?.id && searchParams.get('business') !== active.id) {
      router.replace(`/owner/calendar?business=${active.id}`);
    }
  }, [active?.id, businessesLoaded, router, searchParams, user]);

  useEffect(() => {
    if (!user || !businessId) return;
    fetch('/api/businesses')
      .then((r) => r.json())
      .then((d) => {
        const businesses = (d.businesses || []) as Array<{ id: string; name: string; slug: string }>;
        const biz = businesses.find((item) => item.id === businessId);
        if (biz) setBusiness(biz);
      });
  }, [businessId, user]);

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

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON }),
      end: endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON }),
    });
  }, [viewMonth]);

  const selectedWeekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: WEEK_STARTS_ON });
    return eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(weekStart, { weekStartsOn: WEEK_STARTS_ON }),
    });
  }, [selectedDate]);

  const canPrevMonth = true;
  const canNextMonth = !isAfter(startOfMonth(addMonths(viewMonth, 1)), maxJumpMonth);

  const goToMonth = (next: Date) => {
    let month = startOfMonth(next);
    if (isAfter(month, maxJumpMonth)) month = maxJumpMonth;
    setViewMonth(month);
    if (!isSameMonth(selectedDate, month)) {
      const pick = isSameMonth(today, month) ? today : month;
      setSelectedDate(pick);
    }
  };

  const jumpYear = viewMonth.getFullYear();
  const jumpMonth = viewMonth.getMonth();
  const yearInJumpRange = jumpYears.includes(jumpYear);

  const handleAction = async (bookingId: string, action: string, extra?: Record<string, unknown>) => {
    setActionLoading(bookingId);
    try {
      const patchRes = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const patchData = await patchRes.json();
      const res = await fetch(`/api/bookings?businessId=${businessId}&role=owner`);
      const data = await res.json();
      setBookings(data.bookings || []);
      if (action === 'mark_paid' || action === 'ensure_receipt') {
        const view = patchData.booking ? toReceiptView(patchData.booking) : null;
        if (view) setReceipt(view);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const fallbackBusiness = {
    name: business?.name || active?.name || 'Business',
    location: active?.location ?? null,
  };

  const openSavedReceipt = (booking: Booking) => {
    const view = toReceiptView({
      ...booking,
      receiptNumber: booking.receiptNumber || null,
      paidAt: booking.paidAt || null,
      paymentMode: booking.paymentMode || null,
      business: booking.business || fallbackBusiness,
    });
    if (view) setReceipt(view);
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen pb-32">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href="/owner"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-semibold">{business?.name || 'Calendar'}</h1>
          <p className="text-xs text-gray-500">
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEE, MMM d, yyyy')}
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

      <div className="px-4 py-3">
        <div className="rounded-2xl border bg-white p-3 dark:bg-[#16181d] dark:border-gray-700">
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous month"
              disabled={!canPrevMonth}
              onClick={() => goToMonth(addMonths(viewMonth, -1))}
              className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="min-w-0 flex-1 text-center">
              <div className="font-semibold">{format(viewMonth, 'MMMM yyyy')}</div>
              <p className="text-[11px] text-gray-500">Jump any month through {format(maxJumpMonth, 'MMM yyyy')}</p>
            </div>
            <button
              type="button"
              aria-label="Next month"
              disabled={!canNextMonth}
              onClick={() => goToMonth(addMonths(viewMonth, 1))}
              className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="calendar-month-jump">Month</label>
            <select
              id="calendar-month-jump"
              aria-label="Jump to month"
              className="flex-1 min-w-[8rem] rounded-xl border px-3 py-2 text-sm dark:bg-[#0b0d12] dark:border-gray-700"
              value={jumpMonth}
              onChange={(e) => {
                const monthIndex = Number(e.target.value);
                goToMonth(new Date(jumpYear, monthIndex, 1));
              }}
            >
              {MONTH_LABELS.map((label, index) => {
                const candidate = startOfMonth(new Date(jumpYear, index, 1));
                const disabled = isAfter(candidate, maxJumpMonth);
                return (
                  <option key={label} value={index} disabled={disabled}>
                    {label}
                  </option>
                );
              })}
            </select>
            <label className="sr-only" htmlFor="calendar-year-jump">Year</label>
            <select
              id="calendar-year-jump"
              aria-label="Jump to year"
              className="w-28 rounded-xl border px-3 py-2 text-sm dark:bg-[#0b0d12] dark:border-gray-700"
              value={yearInJumpRange ? String(jumpYear) : ''}
              onChange={(e) => {
                const year = Number(e.target.value);
                let candidate = startOfMonth(new Date(year, jumpMonth, 1));
                if (isAfter(candidate, maxJumpMonth)) candidate = maxJumpMonth;
                if (isBefore(candidate, minJumpMonth) && year === minJumpMonth.getFullYear()) {
                  candidate = minJumpMonth;
                }
                goToMonth(candidate);
              }}
            >
              {!yearInJumpRange ? (
                <option value="" disabled>
                  {jumpYear}
                </option>
              ) : null}
              {jumpYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setViewMonth(startOfMonth(today));
                setSelectedDate(today);
              }}
            >
              Today
            </Button>
          </div>

          <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-gray-500">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="py-1">{label}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((d) => {
              const key = dayKey(d);
              const inMonth = isSameMonth(d, viewMonth);
              const isSelected = isSameDay(d, selectedDate);
              const onDay = activeOnDay(key);
              const alert = hasNewAlert(onDay);
              const beyondHorizon = isAfter(startOfMonth(d), maxJumpMonth);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={beyondHorizon}
                  onClick={() => {
                    setSelectedDate(d);
                    setViewMonth(startOfMonth(d));
                  }}
                  aria-label={`${DAYS[d.getDay()]} ${format(d, 'MMM d, yyyy')}${
                    onDay.length ? `, ${onDay.length} booking${onDay.length === 1 ? '' : 's'}` : ', no bookings'
                  }${alert ? ', new booking alert' : ''}`}
                  className={`relative aspect-square rounded-xl text-center text-sm leading-none disabled:opacity-30 ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : inMonth
                        ? 'bg-gray-50 hover:bg-gray-100 dark:bg-[#0b0d12] dark:hover:bg-gray-800'
                        : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  } ${isToday(d) && !isSelected ? 'ring-1 ring-indigo-400' : ''}`}
                >
                  {alert ? (
                    <span
                      className="apointo-alert-dot absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white"
                      title="New booking alert"
                    />
                  ) : null}
                  <span className={`block pt-1.5 font-semibold ${!inMonth && !isSelected ? 'font-normal' : ''}`}>
                    {d.getDate()}
                  </span>
                  <span className="mt-0.5 flex h-3 items-center justify-center gap-0.5">
                    {onDay.length > 0 ? (
                      <>
                        <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />
                        <span className={`text-[9px] font-medium ${isSelected ? 'text-indigo-100' : 'text-indigo-600'}`}>
                          {onDay.length}
                        </span>
                      </>
                    ) : (
                      <span className="h-1.5" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto">
          {selectedWeekDays.map((d) => {
            const key = dayKey(d);
            const isSelected = isSameDay(d, selectedDate);
            const onDay = activeOnDay(key);
            const alert = hasNewAlert(onDay);
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedDate(d);
                  setViewMonth(startOfMonth(d));
                }}
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
                      <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{formatTime12h(booking.startTime)}</span>
                      <StatusChip status={booking.status} />
                      {booking.isWalkIn && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Walk-in</span>}
                      {booking.paidAt ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                          PAID
                        </span>
                      ) : null}
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

                {!['PENDING', 'CANCELLED', 'REJECTED'].includes(booking.status) && (
                  <div className="mt-3 space-y-2">
                    {booking.paidAt ? (
                      <Button size="sm" variant="outline" onClick={() => openSavedReceipt(booking)}>
                        View receipt
                      </Button>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="rounded-xl border px-2 py-1.5 text-sm"
                          value={payModeById[booking.id] || booking.paymentMode || 'offline'}
                          onChange={(e) => setPayModeById((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                        >
                          <option value="offline">Offline</option>
                          <option value="online">Online</option>
                          <option value="upi">UPI</option>
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                        </select>
                        <Button
                          size="sm"
                          disabled={actionLoading === booking.id}
                          onClick={() =>
                            handleAction(booking.id, 'mark_paid', {
                              paymentMode: payModeById[booking.id] || booking.paymentMode || 'offline',
                            })
                          }
                        >
                          Mark as paid
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actionLoading === booking.id}
                          onClick={() => handleAction(booking.id, 'ensure_receipt')}
                        >
                          Preview receipt
                        </Button>
                      </div>
                    )}
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

      <BookingReceiptModal
        open={Boolean(receipt)}
        receipt={receipt}
        onClose={() => setReceipt(null)}
        sharePhone={receipt?.customerPhone}
      />

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
