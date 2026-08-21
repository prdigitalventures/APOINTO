'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/AuthProvider';
import { ProfileSubpage } from '@/components/profile/ProfileSubpage';

export function ReferPanel({ role }: { role: 'OWNER' | 'CUSTOMER' }) {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const base = role === 'OWNER' ? '/owner/profile' : '/customer/profile';
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.push('/login');
    else if (user.role !== role) router.push(user.role === 'OWNER' ? '/owner' : '/customer');
  }, [loading, role, router, user]);

  useEffect(() => {
    if (user && !user.referralCode) refresh();
  }, [refresh, user]);

  if (loading || !user || user.role !== role) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const link = user.referralLink || `https://www.apointo.online/register?ref=${user.referralCode || ''}`;

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Apointo',
        text: 'Book and run appointments on Apointo — basic plan is free.',
        url: link,
      });
      return;
    }
    await copy();
  };

  return (
    <ProfileSubpage title="Refer" subtitle="Invite owners and customers" backHref={base}>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-[#16181d]">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Share your link. Friends can join the free basic plan. You both get coins when they complete signup.
        </p>
        <p className="mt-4 text-xs text-gray-500">Your code</p>
        <p className="text-xl font-semibold tracking-wide">{user.referralCode || 'Loading...'}</p>
        <p className="mt-3 break-all rounded-xl bg-gray-50 p-3 text-xs dark:bg-[#0b0d12]">{link}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={copy}>
            {copied ? 'Copied' : 'Copy link'}
          </Button>
          <Button onClick={share}>Share</Button>
        </div>
      </div>
    </ProfileSubpage>
  );
}

export function RewardsPanel({ role }: { role: 'OWNER' | 'CUSTOMER' }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const base = role === 'OWNER' ? '/owner/profile' : '/customer/profile';

  useEffect(() => {
    if (loading) return;
    if (!user) router.push('/login');
    else if (user.role !== role) router.push(user.role === 'OWNER' ? '/owner' : '/customer');
  }, [loading, role, router, user]);

  if (loading || !user || user.role !== role) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <ProfileSubpage title="Coins & rewards" subtitle="Earn for using Apointo" backHref={base}>
      <div className="rounded-2xl bg-indigo-600 p-6 text-white">
        <p className="text-sm text-indigo-100">Apointo coins</p>
        <p className="mt-1 text-4xl font-semibold">{user.rewardPoints ?? 0}</p>
        <p className="mt-2 text-sm text-indigo-100">Use coins later for paid plan credits. Basic booking stays free.</p>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 text-sm dark:border-gray-800 dark:bg-[#16181d]">
        <p className="font-medium">How to earn</p>
        <ul className="mt-3 space-y-2 text-gray-600 dark:text-gray-300">
          <li>Add a profile photo — 25 coins</li>
          <li>Send product feedback — 10 coins</li>
          {role === 'OWNER' ? <li>Go live with a booking page — keep using the free plan</li> : <li>Complete a booking — stay on the free customer experience</li>}
          <li>Refer a friend — coins when they join</li>
        </ul>
      </div>
    </ProfileSubpage>
  );
}
