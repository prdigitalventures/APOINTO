'use client';

import { useEffect } from 'react';
import { Download, MessageCircle, Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  buildReceiptShareText,
  formatReceiptInr,
  receiptDownloadFilename,
  receiptPublicPath,
  receiptWhatsAppUrl,
  type ReceiptView,
} from '@/lib/receipt-format';
import { buildReceiptPdfBlob } from '@/lib/receipt-pdf';
import { clientOrigin } from '@/lib/booking-url';

function ThermalPaper({ receipt }: { receipt: ReceiptView }) {
  return (
    <div className="thermal-receipt mx-auto w-[80mm] max-w-full bg-[#fffdf6] px-3 py-4 font-mono text-[11px] leading-relaxed text-gray-900 [border:1px_dashed_#9ca3af]">
      <div className="text-center">
        <p className="text-sm font-bold tracking-[0.18em]">APOINTO RECEIPT</p>
        <p className="mt-2 font-semibold uppercase">{receipt.businessName}</p>
        {receipt.location ? <p className="text-[10px] text-gray-700">{receipt.location}</p> : null}
      </div>

      <div className="my-3 border-t border-dashed border-gray-500" />

      <div className="space-y-0.5">
        <p>Receipt No: {receipt.receiptDisplay}</p>
        <p>Date: {receipt.dateLabel}</p>
        <p>Customer: {receipt.customerName}</p>
        <p>Phone: {receipt.customerPhone}</p>
      </div>

      <div className="my-3 border-t border-dashed border-gray-500" />

      <div className="flex justify-between font-semibold">
        <span>Item</span>
        <span>Price</span>
      </div>
      {receipt.items.map((item) => (
        <div key={`${item.name}-${item.price}`} className="mt-1 flex justify-between gap-2">
          <span className="pr-2">{item.name}</span>
          <span className="shrink-0">{formatReceiptInr(item.price)}</span>
        </div>
      ))}

      <div className="my-3 border-t border-dashed border-gray-500" />

      <div className="flex justify-between text-sm font-bold">
        <span>Total</span>
        <span>{formatReceiptInr(receipt.total)}</span>
      </div>
      <p className="mt-2">Payment: {receipt.paymentModeLabel}</p>

      <div className="mt-3 flex justify-center">
        <span
          className={
            receipt.paid
              ? 'rounded-full bg-green-600 px-3 py-0.5 text-[10px] font-bold tracking-widest text-white'
              : 'rounded-full bg-red-600 px-3 py-0.5 text-[10px] font-bold tracking-widest text-white'
          }
        >
          {receipt.paid ? 'PAID' : 'UNPAID'}
        </span>
      </div>

      <div className="my-3 border-t border-dashed border-gray-500" />
      <p className="text-center">Thank you for booking with us!</p>
    </div>
  );
}

export function BookingReceiptModal({
  open,
  receipt,
  onClose,
  sharePhone,
}: {
  open: boolean;
  receipt: ReceiptView | null;
  onClose: () => void;
  sharePhone?: string | null;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !receipt) return null;

  const viewUrl = `${clientOrigin()}${receiptPublicPath(receipt.receiptNumber)}`;
  const phone = sharePhone || receipt.customerPhone;
  const waUrl = receiptWhatsAppUrl(phone, buildReceiptShareText(receipt, viewUrl));

  const handlePrint = () => {
    document.body.classList.add('receipt-print-mode');
    const cleanup = () => {
      document.body.classList.remove('receipt-print-mode');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const handleDownload = () => {
    const blob = buildReceiptPdfBlob(receipt);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = receiptDownloadFilename(receipt.receiptNumber);
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="receipt-overlay fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="receipt-modal-chrome no-print max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-4 sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Booking Receipt</h2>
          <button type="button" aria-label="Close" className="rounded-full p-1 hover:bg-gray-100" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <ThermalPaper receipt={receipt} />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer size={16} className="mr-1" /> Print
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download size={16} className="mr-1" /> Download
          </Button>
          <Button variant="outline" onClick={() => window.open(waUrl, '_blank')}>
            <MessageCircle size={16} className="mr-1" /> WhatsApp
          </Button>
        </div>
      </div>
      <div className="receipt-print-sheet hidden">
        <ThermalPaper receipt={receipt} />
      </div>
    </div>
  );
}

export function ThermalReceiptPage({ receipt }: { receipt: ReceiptView }) {
  const viewUrl = `${clientOrigin()}${receiptPublicPath(receipt.receiptNumber)}`;
  const waUrl = receiptWhatsAppUrl(receipt.customerPhone, buildReceiptShareText(receipt, viewUrl));

  const handlePrint = () => {
    document.body.classList.add('receipt-print-mode');
    const cleanup = () => {
      document.body.classList.remove('receipt-print-mode');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const handleDownload = () => {
    const blob = buildReceiptPdfBlob(receipt);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = receiptDownloadFilename(receipt.receiptNumber);
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="no-print mb-4 text-lg font-semibold">Booking Receipt</h1>
      <ThermalPaper receipt={receipt} />
      <div className="no-print mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={handlePrint}>
          <Printer size={16} className="mr-1" /> Print
        </Button>
        <Button variant="outline" onClick={handleDownload}>
          <Download size={16} className="mr-1" /> Download
        </Button>
        <Button variant="outline" className="col-span-2" onClick={() => window.open(waUrl, '_blank')}>
          <MessageCircle size={16} className="mr-1" /> WhatsApp
        </Button>
      </div>
    </div>
  );
}
