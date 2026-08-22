'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { BookingReceiptModal } from '@/components/BookingReceipt';
import { StatusChip } from '@/components/ui/StatusChip';
import { useActiveBusiness } from '@/components/ActiveBusinessProvider';
import { toReceiptView, type ReceiptView } from '@/lib/receipt-format';
import { OWNER_LEAD_STATUSES } from '@/lib/owner-booking';
import { formatCurrency, formatTime12h } from '@/lib/utils';

export type OwnerBookingRow = {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  status: string;
  isWalkIn: boolean;
  receiptNumber?: string | null;
  paidAt?: string | null;
  paymentMode?: string | null;
  service: { name: string; price: number };
  staff: { name: string } | null;
  business?: { name: string; location: string | null };
};

export function OwnerBookingBoard({
  mode,
}: {
  mode: 'all' | 'leads' | 'receipts';
}) {
  const { active, loaded } = useActiveBusiness();
  const [bookings, setBookings] = useState<OwnerBookingRow[]>([]);
  const [ready, setReady] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptView | null>(null);

  useEffect(() => {
    if (!loaded) return;
    if (!active?.id) {
      setBookings([]);
      setReady(true);
      return;
    }
    setReady(false);
    fetch(`/api/bookings?businessId=${active.id}&role=owner`)
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings || []))
      .finally(() => setReady(true));
  }, [active?.id, loaded]);

  const rows = useMemo(() => {
    const leadSet = new Set<string>(OWNER_LEAD_STATUSES);
    return bookings
      .filter((b) => {
        if (mode === 'leads') return leadSet.has(b.status);
        if (mode === 'receipts') return Boolean(b.paidAt && b.receiptNumber);
        return true;
      })
      .sort((a, b) => {
        const byDate = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (byDate !== 0) return byDate;
        return b.startTime.localeCompare(a.startTime);
      });
  }, [bookings, mode]);

  if (!ready) {
    return <p className="px-4 py-10 text-sm text-gray-500">Loading...</p>;
  }

  if (!active) {
    return (
      <p className="px-4 py-10 text-sm text-gray-500">
        Create a shop from Home to see this list.
      </p>
    );
  }

  if (rows.length === 0) {
    const empty =
      mode === 'leads'
        ? 'No pending booking requests for this shop.'
        : mode === 'receipts'
          ? 'No paid receipts yet. Mark a booking as paid from Calendar.'
          : 'No bookings yet for this shop.';
    return <p className="px-4 py-10 text-center text-sm text-gray-500">{empty}</p>;
  }

  return (
    <>
      <div className="space-y-3 px-4">
        {rows.map((booking) => {
          const view =
            booking.receiptNumber && booking.business
              ? toReceiptView({
                  id: booking.id,
                  receiptNumber: booking.receiptNumber,
                  paidAt: booking.paidAt || null,
                  paymentMode: booking.paymentMode || null,
                  date: booking.date,
                  customerName: booking.customerName,
                  customerPhone: booking.customerPhone,
                  service: booking.service,
                  business: booking.business,
                })
              : null;
          return (
            <article
              key={booking.id}
              className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-[#16181d]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">
                    {format(new Date(booking.date), 'EEE d MMM yyyy')} · {formatTime12h(booking.startTime)}
                  </p>
                  <h2 className="mt-1 truncate font-semibold">{booking.customerName}</h2>
                  <p className="text-sm text-gray-500">
                    {booking.service.name}
                    {booking.staff ? ` · ${booking.staff.name}` : ''}
                    {' · '}
                    {formatCurrency(booking.service.price)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <StatusChip status={booking.status} />
                  {booking.paidAt ? (
                    <p className="mt-2 text-[11px] font-semibold text-emerald-700">PAID</p>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/owner/calendar?business=${active.id}`}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-indigo-50 py-2 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
                >
                  Open in calendar
                </Link>
                {mode === 'receipts' && view ? (
                  <button
                    type="button"
                    onClick={() => setReceipt(view)}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-50 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                  >
                    Receipt
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      <BookingReceiptModal
        open={Boolean(receipt)}
        receipt={receipt}
        onClose={() => setReceipt(null)}
        sharePhone={receipt?.customerPhone}
      />
    </>
  );
}
