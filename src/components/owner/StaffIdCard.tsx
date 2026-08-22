'use client';

import { Download, Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatEmployeeCode } from '@/lib/staff-code-format';

export type StaffIdView = {
  name: string;
  role: string | null;
  employeeCode: string | null;
  photo: string | null;
  businessName: string;
  phone: string | null;
};

export function StaffIdCardModal({
  open,
  card,
  onClose,
}: {
  open: boolean;
  card: StaffIdView | null;
  onClose: () => void;
}) {
  if (!open || !card) return null;

  const printCard = () => {
    document.body.classList.add('idcard-print-mode');
    window.print();
    window.setTimeout(() => document.body.classList.remove('idcard-print-mode'), 400);
  };

  return (
    <div className="receipt-overlay fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 dark:bg-[#16181d]">
        <div className="receipt-modal-chrome mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Staff ID</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="staff-id-card mx-auto w-[86mm] overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-700 to-slate-900 p-4 text-white">
          <p className="text-[10px] font-semibold tracking-[0.2em]">APOINTO ID</p>
          <div className="mt-3 flex gap-3">
            <div className="h-20 w-16 overflow-hidden rounded-xl bg-white/20">
              {card.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs">Photo</div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight">{card.name}</p>
              <p className="text-xs text-indigo-100">{card.role || 'Team member'}</p>
              <p className="mt-2 font-mono text-sm font-semibold">{formatEmployeeCode(card.employeeCode)}</p>
              {card.phone ? <p className="text-[11px] text-indigo-100">{card.phone}</p> : null}
            </div>
          </div>
          <p className="mt-4 text-xs uppercase tracking-wide text-indigo-100">{card.businessName}</p>
        </div>
        <div className="receipt-modal-chrome mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={printCard}>
            <Printer size={16} className="mr-1" /> Print / Download
          </Button>
        </div>
        <p className="receipt-modal-chrome mt-2 text-center text-xs text-gray-500">
          <Download size={12} className="mr-1 inline" />
          Choose Save as PDF in the print dialog to download the card.
        </p>
      </div>
    </div>
  );
}
