'use client';

import { ActiveBusinessProvider } from '@/components/ActiveBusinessProvider';
import { OwnerBottomNav } from '@/components/AppBottomNav';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ActiveBusinessProvider>
      {children}
      <OwnerBottomNav />
    </ActiveBusinessProvider>
  );
}
