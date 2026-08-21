'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatTime12h } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { ArrowLeft, Check } from 'lucide-react';
import type { BusinessBookingSchema } from '@/lib/booking-schema';
import { useAuth } from '@/components/AuthProvider';

interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  bookingSchema: BusinessBookingSchema;
  services: Array<{ id: string; name: string; price: number; duration: number }>;
  staff: Array<{ id: string; name: string; staffServices: Array<{ serviceId: string }> }>;
}

type Step = 'service' | 'staff' | 'date' | 'time' | 'details' | 'confirm' | 'done';

export default function BookingFlow({ params }: { params: { slug: string } }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [step, setStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [slots, setSlots] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.name && !customerName) setCustomerName(user.name);
    if (user?.phone && !customerPhone) setCustomerPhone(user.phone);
  }, [user, customerName, customerPhone]);

  useEffect(() => {
    fetch(`/api/businesses/${params.slug}`)
      .then((r) => r.json())
      .then((d) => setBusiness(d.business));
  }, [params.slug]);

  useEffect(() => {
    if (business && selectedService && selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const url = `/api/businesses/${params.slug}/slots?serviceId=${selectedService}&date=${dateStr}${selectedStaff ? `&staffId=${selectedStaff}` : ''}`;
      fetch(url).then((r) => r.json()).then((d) => setSlots(d.slots || []));
    }
  }, [business, selectedService, selectedStaff, selectedDate, params.slug]);

  const schema = business?.bookingSchema;
  const staffRequired = schema?.staffRequired ?? true;
  const availableStaff = business?.staff.filter((s) =>
    !selectedService || s.staffServices.some((ss) => ss.serviceId === selectedService)
  ) || [];

  const goNext = () => {
    const steps: Step[] = ['service'];
    if (staffRequired && availableStaff.length > 0) steps.push('staff');
    steps.push('date', 'time', 'details', 'confirm');
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  const submitBooking = async () => {
    if (!business) return;
    if (!user) {
      setError('Please log in and verify your email before booking. You can still browse available times.');
      return;
    }
    if (!user.emailVerified) {
      setError('Please verify your email before booking. Check your inbox, or open Home to resend the link.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          serviceId: selectedService,
          staffId: selectedStaff || undefined,
          date: selectedDate.toISOString(),
          startTime: selectedTime,
          customerName,
          customerPhone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBookingId(data.booking.id);
        setStep('done');
      } else {
        setError(data.error || 'Could not send booking request');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!business) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Booking Request Sent</h1>
          <p className="text-gray-600 mb-6">Waiting for business confirmation.</p>
          <Link href={`/customer/bookings/${bookingId}`}>
            <Button className="w-full">View Booking</Button>
          </Link>
        </div>
      </div>
    );
  }

  const service = business.services.find((s) => s.id === selectedService);
  const staffMember = business.staff.find((s) => s.id === selectedStaff);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
        {step === 'service' ? (
          <Link href={`/${params.slug}`}><ArrowLeft size={20} /></Link>
        ) : (
          <button onClick={() => {
            const steps: Step[] = ['service'];
            if (staffRequired) steps.push('staff');
            steps.push('date', 'time', 'details', 'confirm');
            const idx = steps.indexOf(step);
            if (idx > 0) setStep(steps[idx - 1]);
          }}><ArrowLeft size={20} /></button>
        )}
        <div>
          <h1 className="font-semibold">{business.name}</h1>
          <p className="text-xs text-gray-500 capitalize">{step.replace('_', ' ')}</p>
        </div>
      </header>

      <div className="flex-1 p-4 max-w-lg mx-auto w-full">
        {step === 'service' && (
          <div className="space-y-3">
            <h2 className="font-semibold text-lg mb-4">Choose a service</h2>
            {business.services.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedService(s.id); goNext(); }}
                className={`w-full bg-white rounded-2xl border p-4 text-left hover:border-indigo-300 transition-colors ${selectedService === s.id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-gray-500">{s.duration} min</p>
                  </div>
                  <p className="font-semibold text-indigo-600">{formatCurrency(s.price)}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'staff' && (
          <div className="space-y-3">
            <h2 className="font-semibold text-lg mb-4">Choose staff</h2>
            {availableStaff.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedStaff(s.id); goNext(); }}
                className="w-full bg-white rounded-2xl border p-4 text-left hover:border-indigo-300"
              >
                <p className="font-medium">{s.name}</p>
              </button>
            ))}
            {availableStaff.length === 0 && (
              <Button onClick={goNext} className="w-full">Continue without staff selection</Button>
            )}
          </div>
        )}

        {step === 'date' && (
          <div>
            <h2 className="font-semibold text-lg mb-4">Choose date</h2>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 14 }, (_, i) => {
                const d = addDays(new Date(), i);
                const isSelected = format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedDate(d); goNext(); }}
                    className={`py-3 rounded-xl text-center ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white border'}`}
                  >
                    <div className="text-xs">{format(d, 'EEE')}</div>
                    <div className="text-lg font-semibold">{format(d, 'd')}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 'time' && (
          <div>
            <h2 className="font-semibold text-lg mb-4">Choose time</h2>
            {slots.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No available slots for this date</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => { setSelectedTime(slot); goNext(); }}
                    className={`py-3 rounded-xl text-center font-medium ${selectedTime === slot ? 'bg-indigo-600 text-white' : 'bg-white border hover:border-indigo-300'}`}
                  >
                    {formatTime12h(slot)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg mb-4">Your details</h2>
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Mobile number</label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+91 98765 43210" type="tel" />
            </div>
            <Button className="w-full" onClick={goNext} disabled={!customerName || !customerPhone}>
              Continue
            </Button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg mb-4">Confirm booking</h2>
            {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">{error}</div>}
            {!user && (
              <p className="text-sm text-gray-600">
                You can browse availability freely.{' '}
                <Link href="/login" className="text-indigo-600 font-medium">Log in</Link>
                {' '}and verify your email to send a booking request.
              </p>
            )}
            {user && !user.emailVerified && (
              <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                Your account is not verified yet. Verify the email we sent to book this slot.
              </p>
            )}
            <div className="bg-white rounded-2xl border p-4 space-y-3">
              <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium">{service?.name}</span></div>
              {staffMember && <div className="flex justify-between"><span className="text-gray-500">Staff</span><span className="font-medium">{staffMember.name}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{format(selectedDate, 'EEE, MMM d')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{formatTime12h(selectedTime)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{customerName}</span></div>
              <div className="flex justify-between border-t pt-3"><span className="text-gray-500">Price</span><span className="font-bold text-indigo-600">{formatCurrency(service?.price || 0)}</span></div>
            </div>
            <Button className="w-full" size="lg" onClick={submitBooking} disabled={loading}>
              {loading ? 'Submitting...' : 'Send Booking Request'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
