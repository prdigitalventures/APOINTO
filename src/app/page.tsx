'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { CATEGORIES } from '@/lib/booking-schema';
import {
  Sparkles,
  Calendar,
  Users,
  Menu,
  X,
  Home,
  IndianRupee,
  Store,
  Scissors,
  Stethoscope,
  Wrench,
  GraduationCap,
  Dumbbell,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '#what-is-apointo', label: 'What is Apointo' },
  { href: '#problem', label: 'What problem we are solving' },
] as const;

const DEMO_STORIES = [
  {
    category: 'Salon',
    icon: Scissors,
    name: 'Meera Kulkarni',
    business: 'Glow & Grace Salon, Pune',
    quote:
      'We onboarded in an afternoon on the free plan and started taking bookings the same week. Walk-ins still come, but new customers now find us online.',
  },
  {
    category: 'Clinic',
    icon: Stethoscope,
    name: 'Dr. Arjun Menon',
    business: 'CareFirst Clinic, Kochi',
    quote:
      'Two doctors and a receptionist used to juggle calls. Apointo keeps slots, staff, and patients in one place so we are not double-booking.',
  },
  {
    category: 'Auto service',
    icon: Wrench,
    name: 'Ravi Singh',
    business: 'RapidFix Auto Care, Jaipur',
    quote:
      'I can see every service bay from home. When a car is delayed, I block the slot myself instead of asking someone to sit at the desk.',
  },
  {
    category: 'Tutor',
    icon: GraduationCap,
    name: 'Ananya Iyer',
    business: 'Shree Maths Studio, Bengaluru',
    quote:
      'Parents book demo classes without WhatsApp chaos. The basic plan being free meant I could try it before spending on ads.',
  },
  {
    category: 'Sports',
    icon: Dumbbell,
    name: 'Kabir Sharma',
    business: 'AceServe Badminton, Indore',
    quote:
      'Court hours used to leak through group chats. Members now pick a court, we fill evenings, and I still run everything from my phone.',
  },
  {
    category: 'Home services',
    icon: Home,
    name: 'Farah Qureshi',
    business: 'NestWell Interiors, Hyderabad',
    quote:
      'Consults, site visits, and follow-ups used to overlap. Customers book themselves, and my small team stays aligned without extra staff.',
  },
] as const;

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push(
        user.isStaff || user.role === 'ADMIN' || user.role === 'STAFF'
          ? '/admin'
          : user.role === 'OWNER' || user.role === 'SHOP_STAFF'
            ? '/owner'
            : '/customer'
      );
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
          <a href="#top" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Apointo</span>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-indigo-700 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex gap-3">
            <Link href="/login?role=owner">
              <Button variant="ghost" size="sm">
                Owner Log in
              </Button>
            </Link>
            <Link href="/register?role=owner">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-indigo-50 hover:text-indigo-700"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex gap-3 pt-3">
              <Link href="/login?role=owner" className="flex-1" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full">
                  Owner Log in
                </Button>
              </Link>
              <Link href="/register?role=owner" className="flex-1" onClick={() => setMenuOpen(false)}>
                <Button size="sm" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main id="top" className="flex-1 max-w-6xl mx-auto px-6 py-16 w-full">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Sparkles size={16} /> AI-Powered Booking for Indian SMBs
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Tell us about your business.
            <br />
            <span className="text-indigo-600">AI builds your booking system.</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Universal appointment platform for salons, clinics, yoga, fitness, dental, legal, coworking hubs, and more.
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
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <span
                key={cat.id}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600"
              >
                {cat.icon} {cat.name}
              </span>
            ))}
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

        <section id="what-is-apointo" className="mt-24 scroll-mt-24">
          <p className="text-sm font-medium text-indigo-600 mb-2">What is Apointo</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            A simple booking system your customers can use on their phone.
          </h2>
          <p className="text-gray-600 max-w-3xl leading-relaxed">
            Apointo is an AI-powered appointment platform for Indian small businesses. You describe how you work —
            services, staff, hours — and we generate a live booking page. Customers pick a time, you get a clear
            calendar, and your team stays in sync without extra software.
          </p>
        </section>

        <section id="problem" className="mt-20 scroll-mt-24">
          <p className="text-sm font-medium text-indigo-600 mb-2">What problem we are solving</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Missed calls, double bookings, and WhatsApp chaos.
          </h2>
          <p className="text-gray-600 max-w-3xl leading-relaxed mb-8">
            Most owners still take appointments by phone, notebook, or chat. That breaks when you have more than one
            staff member, more than one location of work, or customers who want to book after hours. Apointo replaces
            that scramble with one shareable link and a calendar you can trust.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { title: 'No more guesswork', desc: 'Customers see real availability instead of waiting for a reply.' },
              { title: 'Staff stay aligned', desc: 'Each person has slots. Overlaps and buffer time are built in.' },
              { title: 'Work from anywhere', desc: 'Confirm, reschedule, or block time from home or the shop floor.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Built for many kinds of owners</h2>
          </div>
          <p className="text-gray-600 max-w-3xl leading-relaxed mb-8">
            Whether you cut hair, run a clinic, teach, repair cars, or rent courts, the pattern is the same: people
            need a time, you need a roster, and both sides need a confirmation. One platform covers the common work —
            setup, scheduling, and day-to-day booking — so you are not stitching together three tools.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Salons', 'Clinics', 'Auto workshops', 'Tutors', 'Sports & courts', 'Home services', 'Wellness'].map(
              (label) => (
                <span
                  key={label}
                  className="text-sm font-medium text-indigo-700 bg-indigo-50 rounded-full px-3 py-1.5"
                >
                  {label}
                </span>
              )
            )}
          </div>
        </section>

        <section className="mt-20">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-8">
            <div className="w-12 h-12 shrink-0 bg-indigo-600 rounded-2xl flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-600 mb-1">Pricing</p>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">The basic plan is free of cost</h2>
              <p className="text-gray-600 max-w-2xl leading-relaxed">
                Start with a live booking page, core calendar, and AI setup at no charge. Get customers on the
                platform first. Upgrade later only if you need more capacity — not before you have seen it work.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-3">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Stories from business owners</h2>
            <span className="text-xs font-medium uppercase tracking-wide text-indigo-700 bg-indigo-50 rounded-full px-3 py-1 w-fit">
              Demo testimonials
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-8 max-w-2xl">
            Illustrative examples of how Indian SMBs can use Apointo. These are demo stories for the product site,
            not celebrity endorsements or verified reviews.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {DEMO_STORIES.map(({ category, icon: Icon, name, business, quote }) => (
              <figure
                key={business}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col"
              >
                <div className="flex items-center gap-2 text-indigo-700 text-sm font-medium mb-4">
                  <Icon className="w-4 h-4" />
                  {category}
                </div>
                <blockquote className="text-gray-700 text-sm leading-relaxed flex-1">“{quote}”</blockquote>
                <figcaption className="mt-5 pt-4 border-t border-gray-100">
                  <p className="font-semibold text-gray-900 text-sm">{name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{business}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
          <p>© 2026 all rights reserved with Apointo.online</p>
          <p>
            Support:{' '}
            <a
              href="mailto:apointosupport@pozer.co.in"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              apointosupport@pozer.co.in
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
