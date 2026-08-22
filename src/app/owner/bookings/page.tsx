'use client';

import { OwnerBookingBoard } from '@/components/owner/OwnerBookingBoard';
import { OwnerSubpageFrame } from '@/components/owner/OwnerSubpageFrame';

export default function OwnerBookingsPage() {
  return (
    <OwnerSubpageFrame title="Bookings" subtitle="Every appointment for the selected shop">
      <OwnerBookingBoard mode="all" />
    </OwnerSubpageFrame>
  );
}
