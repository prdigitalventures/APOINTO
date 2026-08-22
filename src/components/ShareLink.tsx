'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, MessageCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { canonicalBookingUrl, clientOrigin } from '@/lib/booking-url';

interface ShareLinkProps {
  slug: string;
  businessName: string;
}

export function ShareLink({ slug, businessName }: ShareLinkProps) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);

  const bookingUrl = canonicalBookingUrl(slug, clientOrigin());

  useEffect(() => {
    QRCode.toDataURL(bookingUrl, { width: 200, margin: 2 }).then(setQrDataUrl);
  }, [bookingUrl]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Book an appointment at ${businessName}: ${bookingUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm text-gray-500 mb-1">Your booking link</p>
        <p className="font-mono text-sm text-indigo-600 break-all">{bookingUrl}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={copyLink}>
          {copied ? <Check size={16} className="mr-1" /> : <Copy size={16} className="mr-1" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
        <Button variant="outline" size="sm" onClick={shareWhatsApp}>
          <MessageCircle size={16} className="mr-1" /> WhatsApp
        </Button>
      </div>

      {qrDataUrl && (
        <div className="text-center">
          <img src={qrDataUrl} alt="QR Code" className="mx-auto rounded-lg" />
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={async () => {
              await navigator.clipboard.writeText(bookingUrl);
              setCopiedQr(true);
              setTimeout(() => setCopiedQr(false), 2000);
            }}
          >
            {copiedQr ? 'Copied!' : 'Copy QR Link'}
          </Button>
        </div>
      )}
    </div>
  );
}
