'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { CustomerAssistantBar } from '@/components/CustomerAssistantBar';
import { formatTime12h, CATEGORIES } from '@/lib/utils';
import { format, isToday, isTomorrow } from 'date-fns';
import { Calendar, LogOut, MapPin, Navigation } from 'lucide-react';

interface Booking {
  id: string;
  date: string;
  startTime: string;
  status: string;
  service: { name: string };
  staff: { name: string } | null;
  business: { name: string; slug: string; category: string };
}

interface DiscoveredBusiness {
  id: string;
  name: string;
  slug: string;
  category: string;
  location: string | null;
  distanceKm?: number;
  services: Array<{ name: string; price: number }>;
}

interface LocationState {
  city: string;
  latitude?: number;
  longitude?: number;
  label: string;
}

const CITY_PRESETS = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune'];

export default function CustomerHome() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [location, setLocation] = useState<LocationState>({ city: '', label: 'Set location' });
  const [cityInput, setCityInput] = useState('');
  const [businesses, setBusinesses] = useState<DiscoveredBusiness[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role === 'OWNER') router.push('/owner');
  }, [user, loading, router]);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('apointo-location') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as LocationState;
        setLocation(parsed);
        setCityInput(parsed.city);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetch('/api/bookings').then((r) => r.json()).then((d) => setBookings(d.bookings || []));
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (location.city) params.set('city', location.city);
    if (category) params.set('category', category);
    if (location.latitude != null) params.set('lat', String(location.latitude));
    if (location.longitude != null) params.set('lng', String(location.longitude));
    fetch(`/api/discover?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setBusinesses(d.businesses || []));
  }, [location, category]);

  const saveLocation = (next: LocationState) => {
    setLocation(next);
    localStorage.setItem('apointo-location', JSON.stringify(next));
  };

  const useCity = (city: string) => {
    const next = { city, label: city };
    setCityInput(city);
    saveLocation(next);
  };

  const useLiveLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        let city = 'Near me';
        try {
          const geo = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await geo.json();
          city =
            data.address?.city ||
            data.address?.town ||
            data.address?.state_district ||
            data.address?.state ||
            'Near me';
        } catch {
          /* keep Near me */
        }
        saveLocation({ city, latitude, longitude, label: `Near ${city}` });
        setCityInput(city);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

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
      <header className="bg-white px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500">Hi, {user.name.split(' ')[0]} 👋</p>
            <h1 className="text-xl font-bold">What do you want to book?</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}><LogOut size={18} /></Button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 rounded-full px-3 py-1.5 whitespace-nowrap">
            <MapPin size={12} /> {location.label}
          </span>
          <button
            type="button"
            onClick={useLiveLocation}
            className="flex items-center gap-1 text-xs bg-white border rounded-full px-3 py-1.5 whitespace-nowrap"
          >
            <Navigation size={12} /> {locating ? 'Locating…' : 'Allow my location'}
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (cityInput.trim()) useCity(cityInput.trim());
          }}
          className="flex gap-2"
        >
          <input
            className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-sm"
            placeholder="Update location, e.g. Bangalore"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
          />
          <Button type="submit" size="sm">Update</Button>
        </form>
        <div className="flex gap-2 overflow-x-auto">
          {CITY_PRESETS.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => useCity(city)}
              className={`text-xs rounded-full px-3 py-1 border ${location.city === city ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'}`}
            >
              {city}
            </button>
          ))}
        </div>

        <CustomerAssistantBar
          location={location}
          onNavigateBooking={(id) => router.push(`/customer/bookings/${id}`)}
        />
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
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(category === cat.id ? null : cat.id)}
                className={`bg-white rounded-xl border p-3 text-center ${category === cat.id ? 'border-indigo-500 ring-2 ring-indigo-100' : ''}`}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <p className="text-xs text-gray-600">{cat.name}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-semibold mb-3">
            {location.city ? `Available in ${location.city}` : 'Available businesses'}
            {category ? ` · ${CATEGORIES.find((c) => c.id === category)?.name}` : ''}
          </h2>
          {businesses.length === 0 ? (
            <p className="text-sm text-gray-500">No businesses found for this location yet. Try Bangalore to see demo listings.</p>
          ) : (
            <div className="space-y-3">
              {businesses.map((biz) => (
                <Link key={biz.id} href={`/${biz.slug}`}>
                  <div className="bg-white rounded-2xl border p-4">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold">{biz.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {biz.category}
                          {biz.location ? ` · ${biz.location}` : ''}
                        </p>
                        {biz.services?.[0] && (
                          <p className="text-xs text-gray-500 mt-1">
                            {biz.services.map((s) => s.name).join(', ')}
                          </p>
                        )}
                      </div>
                      {biz.distanceKm != null && (
                        <span className="text-xs text-indigo-600">{biz.distanceKm} km</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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
