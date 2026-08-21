'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatTime12h, DAYS } from '@/lib/utils';
import { MapPin, Clock } from 'lucide-react';
import type { BusinessBookingSchema } from '@/lib/booking-schema';

interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  location: string | null;
  about: string | null;
  bookingSchema: BusinessBookingSchema;
  services: Array<{ id: string; name: string; price: number; duration: number; description: string | null }>;
  staff: Array<{ id: string; name: string; role: string | null }>;
  businessHours: Array<{ day: number; openingTime: string; closingTime: string; isClosed: boolean }>;
}

export default function BusinessPage({ params }: { params: { slug: string } }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/businesses/${params.slug}`)
      .then((r) => r.json())
      .then((d) => { setBusiness(d.business); setLoading(false); });
  }, [params.slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!business) return <div className="min-h-screen flex items-center justify-center">Business not found</div>;

  const openDays = business.businessHours.filter((h) => !h.isClosed);

  return (
    <div className="min-h-screen pb-24">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white px-6 py-10">
        <div className="max-w-lg mx-auto">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-4">
            {getCategoryEmoji(business.category)}
          </div>
          <h1 className="text-2xl font-bold">{business.name}</h1>
          <p className="text-indigo-100 capitalize mt-1">{business.category}</p>
          {business.location && (
            <p className="flex items-center gap-1 text-indigo-100 text-sm mt-2">
              <MapPin size={14} /> {business.location}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        {business.about && (
          <div className="bg-white rounded-2xl border p-4">
            <h2 className="font-semibold mb-2">About</h2>
            <p className="text-sm text-gray-600">{business.about}</p>
          </div>
        )}

        {openDays.length > 0 && (
          <div className="bg-white rounded-2xl border p-4">
            <h2 className="font-semibold mb-2 flex items-center gap-2"><Clock size={16} /> Working Hours</h2>
            <div className="space-y-1">
              {openDays.map((h) => (
                <div key={h.day} className="flex justify-between text-sm">
                  <span className="text-gray-600">{DAYS[h.day]}</span>
                  <span>{formatTime12h(h.openingTime)} – {formatTime12h(h.closingTime)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border p-4">
          <h2 className="font-semibold mb-3">Services</h2>
          <div className="space-y-3">
            {business.services.map((service) => (
              <div key={service.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-xs text-gray-500">{service.duration} min</p>
                </div>
                <p className="font-semibold text-indigo-600">{formatCurrency(service.price)}</p>
              </div>
            ))}
          </div>
        </div>

        {business.staff.length > 0 && (
          <div className="bg-white rounded-2xl border p-4">
            <h2 className="font-semibold mb-3">Team</h2>
            <div className="flex flex-wrap gap-2">
              {business.staff.map((s) => (
                <span key={s.id} className="bg-gray-100 rounded-full px-3 py-1 text-sm">{s.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-bottom">
        <div className="max-w-lg mx-auto">
          <Link href={`/${business.slug}/book`}>
            <Button size="lg" className="w-full">BOOK APPOINTMENT</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    beauty: '💇', health: '🏥', auto: '🚗', education: '📚',
    sports: '⚽', fitness: '💪', home: '🏠', professional: '📸', legal: '⚖️',
  };
  return emojis[category] || '🏢';
}
