'use client';

import { OwnerBookingBoard } from '@/components/owner/OwnerBookingBoard';
import { OwnerSubpageFrame } from '@/components/owner/OwnerSubpageFrame';

export default function OwnerLeadsPage() {
  return (
    <OwnerSubpageFrame
      title="Leads"
      subtitle="Pending requests and time-change asks — accept them from Calendar"
    >
      <OwnerBookingBoard mode="leads" />
    </OwnerSubpageFrame>
  );
}
