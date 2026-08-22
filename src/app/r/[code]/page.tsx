'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ThermalReceiptPage } from '@/components/BookingReceipt';
import { compactReceiptCode, type ReceiptView } from '@/lib/receipt-format';

export default function PublicReceiptPage() {
  const params = useParams<{ code: string }>();
  const [receipt, setReceipt] = useState<ReceiptView | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const code = compactReceiptCode(String(params.code || ''));
    if (!code) {
      setError('Receipt not found');
      return;
    }
    fetch(`/api/receipts/${encodeURIComponent(code)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Not found');
        setReceipt(data.receipt);
      })
      .catch(() => setError('This receipt is not available.'));
  }, [params.code]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-gray-600">
        {error}
      </div>
    );
  }

  if (!receipt) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return <ThermalReceiptPage receipt={receipt} />;
}
