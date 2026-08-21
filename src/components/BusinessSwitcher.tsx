'use client';

import { useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { useActiveBusiness } from './ActiveBusinessProvider';

export function BusinessSwitcher({ compact = false }: { compact?: boolean }) {
  const { businesses, active, setActiveId } = useActiveBusiness();
  const [open, setOpen] = useState(false);

  if (businesses.length === 0) return null;

  return (
    <div className={compact ? '' : 'px-4 pt-3'}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-left dark:border-indigo-900 dark:bg-indigo-950/50"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{active?.name || 'Select business'}</span>
          {active?.category ? (
            <span className="block truncate text-xs capitalize text-indigo-700 dark:text-indigo-300">
              {active.category}
              {active.uniqueCode ? ` · ${active.uniqueCode}` : ''}
            </span>
          ) : null}
        </span>
        {businesses.length > 1 ? <ChevronsUpDown size={16} className="shrink-0 text-indigo-600" /> : null}
      </button>
      {open && businesses.length > 1 ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-[#16181d]">
          {businesses.map((biz) => (
            <button
              key={biz.id}
              type="button"
              onClick={() => {
                setActiveId(biz.id);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2.5 text-left text-sm ${
                biz.id === active?.id ? 'bg-indigo-50 font-medium text-indigo-800 dark:bg-indigo-950' : ''
              }`}
            >
              {biz.name}
              <span className="mt-0.5 block text-xs capitalize text-gray-500">{biz.category}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
