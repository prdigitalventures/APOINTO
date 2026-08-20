'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Sparkles, Calendar, Users } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(user.role === 'OWNER' ? '/owner' : '/customer');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Apointo</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
          <Link href="/register"><Button size="sm">Get Started</Button></Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Sparkles size={16} /> AI-Powered Booking for Indian SMBs
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Tell us about your business.<br />
            <span className="text-indigo-600">AI builds your booking system.</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Universal appointment platform for salons, clinics, auto services, tutors, sports courts, and more.
            Go live in under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=owner">
              <Button size="lg" className="w-full sm:w-auto">
                Create My Booking System
              </Button>
            </Link>
            <Link href="/register?role=customer">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Book an Appointment
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-20">
          {[
            { icon: Sparkles, title: 'AI Setup', desc: 'Describe your business in plain language. AI handles the rest.' },
            { icon: Calendar, title: 'Smart Scheduling', desc: 'Real-time availability with staff, breaks, and buffer time.' },
            { icon: Users, title: 'Any Business', desc: 'Salons, clinics, tutors, sports — one platform for all.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
