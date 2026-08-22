'use client';

import { useEffect, useState } from 'react';
import { useActiveBusiness } from '@/components/ActiveBusinessProvider';
import { OwnerSubpageFrame } from '@/components/owner/OwnerSubpageFrame';
import { formatCurrency } from '@/lib/utils';

type ServiceRow = {
  id: string;
  name: string;
  price: number;
  duration: number;
  isActive: boolean;
};

export default function OwnerServicesPage() {
  const { active, loaded } = useActiveBusiness();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    fetch('/api/businesses')
      .then((r) => r.json())
      .then((d) => {
        const list = (d.businesses || []) as Array<{ id: string; services?: ServiceRow[] }>;
        const shop = list.find((b) => b.id === active?.id);
        setServices((shop?.services || []).filter((s) => s.isActive !== false));
      })
      .finally(() => setReady(true));
  }, [active?.id, loaded]);

  return (
    <OwnerSubpageFrame title="Services" subtitle="Menu for the selected shop">
      {!ready ? (
        <p className="px-4 text-sm text-gray-500">Loading...</p>
      ) : services.length === 0 ? (
        <p className="px-4 text-sm text-gray-500">
          No services yet. They are created when you set up the shop from Home.
        </p>
      ) : (
        <div className="space-y-3 px-4">
          {services.map((service) => (
            <article
              key={service.id}
              className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-[#16181d]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{service.name}</h2>
                  <p className="text-sm text-gray-500">{service.duration} min</p>
                </div>
                <p className="font-semibold tabular-nums">{formatCurrency(service.price)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </OwnerSubpageFrame>
  );
}
