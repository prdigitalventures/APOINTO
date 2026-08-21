'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatTime12h, DAYS } from '@/lib/utils';
import { CalendarCheck, Clock, MapPin, Navigation, Phone, Share2 } from 'lucide-react';
import type { BusinessBookingSchema } from '@/lib/booking-schema';
import { getCategoryDisplayName } from '@/lib/booking-schema';
import { formatBusinessCode, googleMapsSearchUrl } from '@/lib/place';
import { FavoriteButton, QrSticker } from '@/components/QrSticker';

interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  location: string | null;
  about: string | null;
  logo: string | null;
  uniqueCode: string | null;
  contactPhone: string | null;
  bookingSchema: BusinessBookingSchema;
  services: Array<{ id: string; name: string; price: number; duration: number; description: string | null }>;
  staff: Array<{ id: string; name: string; role: string | null }>;
  businessHours: Array<{ day: number; openingTime: string; closingTime: string; isClosed: boolean }>;
}

export default function BusinessPage({ params }: { params: { slug: string } }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'photos' | 'qr'>('overview');

  useEffect(() => {
    fetch(`/api/businesses/${params.slug}`)
      .then((r) => r.json())
      .then((d) => {
        setBusiness(d.business);
        setLoading(false);
      });
  }, [params.slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!business) return <div className="min-h-screen flex items-center justify-center">Business not found</div>;

  const mapsUrl = business.location ? googleMapsSearchUrl(business.location) : null;
  const today = new Date().getDay();
  const hoursToday = business.businessHours.find((h) => h.day === today);
  const servicePreview = business.services.slice(0, 3).map((s) => s.name).join(', ');

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: business.name, url, text: `Book at ${business.name}` });
      return;
    }
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="min-h-screen pb-28 bg-gray-50 dark:bg-[#0b0d12]">
      <div className="bg-white px-4 pt-8 pb-4 dark:bg-[#16181d]">
        <div className="mx-auto max-w-lg">
          {business.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logo} alt="" className="mb-3 h-16 w-16 rounded-2xl object-cover" />
          ) : null}
          <h1 className="text-2xl font-bold">{business.name}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {getCategoryDisplayName(business.category)}
            {business.uniqueCode ? ` · ${formatBusinessCode(business.uniqueCode)}` : ''}
          </p>
          {business.description ? (
            <p className="mt-2 text-sm text-gray-600">{business.description}</p>
          ) : null}

          <div className="mt-4 flex gap-2">
            {['overview', 'photos', 'qr'].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id as typeof tab)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  tab === id ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                {id === 'qr' ? 'QR sticker' : id[0].toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-3 px-4 py-4">
        {tab === 'photos' ? (
          <div className="overflow-hidden rounded-2xl border bg-white dark:bg-[#16181d]">
            {business.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logo} alt="" className="h-56 w-full object-cover" />
            ) : (
              <p className="p-8 text-center text-sm text-gray-500">No photos yet</p>
            )}
          </div>
        ) : null}

        {tab === 'qr' ? (
          <div className="rounded-2xl border bg-white p-4 dark:bg-[#16181d]">
            <QrSticker
              slug={business.slug}
              businessName={business.name}
              phone={business.contactPhone}
              address={business.location}
              uniqueCode={business.uniqueCode}
              category={getCategoryDisplayName(business.category)}
            />
            <div className="mt-3 flex justify-center">
              <FavoriteButton slug={business.slug} />
            </div>
          </div>
        ) : null}

        {tab === 'overview' ? (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Link
                href={`/${business.slug}/book`}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
              >
                <CalendarCheck size={14} /> Book
              </Link>
              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border bg-white px-3 py-2 text-sm dark:bg-[#16181d]"
                >
                  <Navigation size={14} /> Directions
                </a>
              ) : null}
              <FavoriteButton slug={business.slug} appearance="pill" />
              <button
                type="button"
                onClick={share}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border bg-white px-3 py-2 text-sm dark:bg-[#16181d]"
              >
                <Share2 size={14} /> Share
              </button>
              {business.contactPhone ? (
                <a
                  href={`tel:${business.contactPhone}`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border bg-white px-3 py-2 text-sm dark:bg-[#16181d]"
                >
                  <Phone size={14} /> Call
                </a>
              ) : null}
            </div>

            {hoursToday ? (
              <div className="flex items-start gap-3 rounded-2xl border bg-white p-4 dark:bg-[#16181d]">
                <Clock size={18} className="mt-0.5 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium">
                    {hoursToday.isClosed
                      ? 'Closed today'
                      : `Open · Closes ${formatTime12h(hoursToday.closingTime)}`}
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    {business.businessHours.map((h) => (
                      <div key={h.day} className="flex justify-between gap-6">
                        <span>{DAYS[h.day]}</span>
                        <span>{h.isClosed ? 'Closed' : `${formatTime12h(h.openingTime)} – ${formatTime12h(h.closingTime)}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {servicePreview ? (
              <Link href={`/${business.slug}/book`} className="flex items-center justify-between rounded-2xl border bg-white p-4 dark:bg-[#16181d]">
                <div>
                  <p className="text-sm font-medium">Services</p>
                  <p className="text-sm text-gray-500">{servicePreview}</p>
                </div>
                <span className="text-indigo-600">Book</span>
              </Link>
            ) : null}

            {business.location ? (
              <a
                href={mapsUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 rounded-2xl border bg-white p-4 dark:bg-[#16181d]"
              >
                <MapPin size={18} className="mt-0.5 text-indigo-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-gray-600">{business.location}</p>
                  <p className="mt-1 text-xs font-medium text-indigo-700">Open in Google Maps</p>
                </div>
              </a>
            ) : null}

            {business.about ? (
              <div className="rounded-2xl border bg-white p-4 dark:bg-[#16181d]">
                <h2 className="font-semibold mb-2">About</h2>
                <p className="text-sm text-gray-600">{business.about}</p>
              </div>
            ) : null}

            <div className="rounded-2xl border bg-white p-4 dark:bg-[#16181d]">
              <h2 className="font-semibold mb-3">Menu</h2>
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
          </>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-bottom dark:bg-[#16181d]">
        <div className="max-w-lg mx-auto">
          <Link href={`/${business.slug}/book`}>
            <Button size="lg" className="w-full">Book appointment</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
