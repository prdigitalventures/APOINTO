'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { ProfileSubpage } from '@/components/profile/ProfileSubpage';

const SUPPORT = 'apointosupport@pozer.co.in';

const PAGES = {
  about: {
    title: 'About us',
    subtitle: 'What Apointo is',
    body: [
      'Apointo is an AI-powered appointment platform for Indian small businesses — salons, clinics, auto shops, tutors, sports courts, legal practices, and more.',
      'Owners describe their work in plain language. We generate a live booking page. Customers pick a time. The calendar stays in one place, including when the owner is at home.',
      'The basic plan is free of cost so businesses can go live first and upgrade later only if they need more capacity.',
    ],
  },
  'how-to': {
    title: 'How to use',
    subtitle: 'HTU — a short walkthrough',
    body: [],
  },
  faqs: {
    title: 'FAQs',
    subtitle: 'Questions people ask us',
    body: [],
  },
  privacy: {
    title: 'Privacy',
    subtitle: 'How we handle your data',
    body: [
      'We store the name, phone, and email you give us so you can sign in and receive booking updates.',
      'Owners also store business details, services, staff, and appointment times needed to run the calendar.',
      'We do not sell your contact list. Photos you upload stay on your account for the public booking page or profile.',
      `For a deletion or correction request, email ${SUPPORT}.`,
    ],
  },
  terms: {
    title: 'Terms',
    subtitle: 'Using Apointo',
    body: [
      'Apointo is a booking tool. You are responsible for the services you list, the prices you set, and how you treat customers.',
      'The basic plan is free. Paid features, when offered, will be described before you upgrade.',
      'Demo testimonials on the marketing site are illustrative, not celebrity endorsements.',
      `Questions: ${SUPPORT}.`,
    ],
  },
} as const;

type PageKey = keyof typeof PAGES;

function HowTo({ role }: { role: 'OWNER' | 'CUSTOMER' }) {
  if (role === 'OWNER') {
    return (
      <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
        <li>Open Home and start AI Business Builder, or finish a listing under Business details.</li>
        <li>Add services, prices, staff, and hours. Share the booking link or QR from Home.</li>
        <li>Use Calendar for the day, Alerts for new bookings, and CRM for customer history.</li>
        <li>Update shop photo and address in Profile → Business details so customers recognise you.</li>
      </ol>
    );
  }
  return (
    <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
      <li>On Home, search a business or use the voice assistant to find a slot.</li>
      <li>Pick a service and time. Confirm only after the details look right — no payment in this version.</li>
      <li>Open Bookings for upcoming visits and Alerts for changes.</li>
      <li>Add a profile photo under Account. Use Refer to invite a shop you already visit.</li>
    </ol>
  );
}

function Faqs({ role }: { role: 'OWNER' | 'CUSTOMER' }) {
  const items =
    role === 'OWNER'
      ? [
          ['Is the basic plan really free?', 'Yes. You can go live with a booking page, calendar, and AI setup at no charge.'],
          ['Can I manage bookings from home?', 'Yes. Calendar, alerts, and CRM work from your phone.'],
          ['How do customers find me?', 'Share your Apointo link or QR. They can also search when they are nearby.'],
          ['Google login not working?', 'Add your Google account as a test user on the OAuth consent screen, or use phone/email login.'],
          ['Where do I add a shop photo?', 'Profile → Business details → Upload business photo.'],
        ]
      : [
          ['Do I pay on Apointo?', 'This version does not collect payment. You settle with the business as you normally would.'],
          ['I did not get a verification email.', 'Check spam, or ask the owner to honour a walk-in. Support: apointosupport@pozer.co.in.'],
          ['Can I cancel?', 'Open Bookings and follow the cancellation window the shop set.'],
          ['How do I change my photo?', 'Profile → Account → Upload profile photo.'],
          ['Is my phone number shared?', 'The shop sees it so they can confirm the visit. We do not sell contact lists.'],
        ];
  return (
    <div className="space-y-4">
      {items.map(([q, a]) => (
        <div key={q}>
          <p className="text-sm font-medium">{q}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{a}</p>
        </div>
      ))}
    </div>
  );
}

export function ProfileInfoPage({
  role,
  page,
}: {
  role: 'OWNER' | 'CUSTOMER';
  page: PageKey;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const base = role === 'OWNER' ? '/owner/profile' : '/customer/profile';
  const meta = PAGES[page];

  useEffect(() => {
    if (loading) return;
    if (!user) router.push('/login');
    else if (user.role !== role) router.push(user.role === 'OWNER' ? '/owner' : '/customer');
  }, [loading, role, router, user]);

  if (loading || !user || user.role !== role) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <ProfileSubpage title={meta.title} subtitle={meta.subtitle} backHref={base}>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-[#16181d]">
        {page === 'how-to' ? <HowTo role={role} /> : null}
        {page === 'faqs' ? <Faqs role={role} /> : null}
        {page !== 'how-to' && page !== 'faqs'
          ? meta.body.map((p) => (
              <p key={p} className="mb-3 text-sm text-gray-600 last:mb-0 dark:text-gray-300">
                {p}
              </p>
            ))
          : null}
      </div>
    </ProfileSubpage>
  );
}
