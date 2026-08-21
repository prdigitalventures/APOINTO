'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Phone, UsersRound } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { formatTime12h } from '@/lib/utils';

interface Customer {
  name: string;
  phone: string;
  lastBooking: string;
  lastBookingTime: string;
  businessName: string;
}

export default function OwnerCrmPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'OWNER') {
      router.push('/customer');
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user || user.role !== 'OWNER') return;

    fetch('/api/owner/customers')
      .then((response) => response.json())
      .then((data) => setCustomers(data.customers || []))
      .finally(() => setLoaded(true));
  }, [user]);

  if (loading || !user || !loaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="border-b bg-white px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <UsersRound size={19} />
          </div>
          <div>
            <h1 className="font-semibold">Customer CRM</h1>
            <p className="text-xs text-gray-500">Customers who booked your businesses</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg p-4">
        {customers.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <UsersRound className="mx-auto mb-3 text-violet-200" size={34} />
            <p>No customers have booked yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map((customer) => (
              <article key={customer.phone} className="rounded-2xl border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{customer.name}</h2>
                    <a
                      href={`tel:${customer.phone}`}
                      className="mt-1 flex items-center gap-1.5 text-sm text-indigo-700"
                    >
                      <Phone size={14} />
                      {customer.phone}
                    </a>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-500">Last booking</p>
                    <p className="text-sm font-medium">
                      {format(new Date(customer.lastBooking), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime12h(customer.lastBookingTime)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 border-t pt-3 text-xs text-gray-500">
                  {customer.businessName}
                </p>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
