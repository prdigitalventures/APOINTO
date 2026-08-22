'use client';

import { OwnerBookingBoard } from '@/components/owner/OwnerBookingBoard';
import { OwnerSubpageFrame } from '@/components/owner/OwnerSubpageFrame';

export default function OwnerReceiptsPage() {
  return (
    <OwnerSubpageFrame title="Invoices" subtitle="Paid receipts for the selected shop">
      <OwnerBookingBoard mode="receipts" />
    </OwnerSubpageFrame>
  );
}
