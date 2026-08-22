'use client';

import { useEffect, useState } from 'react';
import { useActiveBusiness } from '@/components/ActiveBusinessProvider';
import { OwnerSubpageFrame } from '@/components/owner/OwnerSubpageFrame';

type StaffRow = {
  id: string;
  name: string;
  role: string | null;
  isActive: boolean;
};

export default function OwnerStaffPage() {
  const { active, loaded } = useActiveBusiness();
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    fetch('/api/businesses')
      .then((r) => r.json())
      .then((d) => {
        const list = (d.businesses || []) as Array<{ id: string; staff?: StaffRow[] }>;
        const shop = list.find((b) => b.id === active?.id);
        setStaff((shop?.staff || []).filter((s) => s.isActive !== false));
      })
      .finally(() => setReady(true));
  }, [active?.id, loaded]);

  return (
    <OwnerSubpageFrame title="Staff" subtitle="Team on the selected shop calendar">
      {!ready ? (
        <p className="px-4 text-sm text-gray-500">Loading...</p>
      ) : staff.length === 0 ? (
        <p className="px-4 text-sm text-gray-500">
          No staff listed. If you work alone, bookings still attach to the shop.
        </p>
      ) : (
        <div className="space-y-3 px-4">
          {staff.map((member) => (
            <article
              key={member.id}
              className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-[#16181d]"
            >
              <h2 className="font-semibold">{member.name}</h2>
              <p className="text-sm text-gray-500">{member.role || 'Team member'}</p>
            </article>
          ))}
        </div>
      )}
    </OwnerSubpageFrame>
  );
}
