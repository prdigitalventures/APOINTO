'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Bookmark, Download, Share2 } from 'lucide-react';
import { Button } from './ui/Button';
import { formatBusinessCode, readFavoriteSlugs, toggleFavoriteSlug } from '@/lib/place';

interface QrStickerProps {
  slug: string;
  businessName: string;
  phone?: string | null;
  address?: string | null;
  uniqueCode?: string | null;
  category?: string | null;
}

export function QrSticker({ slug, businessName, phone, address, uniqueCode, category }: QrStickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState('');
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.apointo.online';
  const bookingUrl = `${origin}/${slug}`;
  const codeLabel = uniqueCode ? formatBusinessCode(uniqueCode) : '';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 1080;
    const h = 1520;
    canvas.width = w;
    canvas.height = h;

    QRCode.toDataURL(bookingUrl, { width: 640, margin: 1, color: { dark: '#111111', light: '#ffffff' } }).then(
      (qr) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#4f46e5';
        ctx.fillRect(0, 0, w, 18);

        ctx.fillStyle = '#111827';
        ctx.textAlign = 'center';
        ctx.font = '700 42px Inter, system-ui, sans-serif';
        ctx.fillText('APOINTO', w / 2, 90);
        ctx.font = '500 28px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText('Scan to book', w / 2, 130);

        ctx.fillStyle = '#111827';
        ctx.font = '700 48px Inter, system-ui, sans-serif';
        wrapText(ctx, businessName, w / 2, 210, w - 120, 56);

        if (category) {
          ctx.font = '500 28px Inter, system-ui, sans-serif';
          ctx.fillStyle = '#4f46e5';
          ctx.fillText(category, w / 2, 320);
        }

        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, (w - 640) / 2, 360, 640, 640);
          ctx.fillStyle = '#111827';
          ctx.font = '700 40px Inter, system-ui, sans-serif';
          if (codeLabel) ctx.fillText(codeLabel, w / 2, 1060);
          ctx.font = '500 28px Inter, system-ui, sans-serif';
          ctx.fillStyle = '#374151';
          if (phone) ctx.fillText(phone, w / 2, 1115);
          if (address) wrapText(ctx, address, w / 2, 1170, w - 140, 36);
          ctx.font = '500 24px Inter, system-ui, sans-serif';
          ctx.fillStyle = '#6b7280';
          ctx.fillText(bookingUrl.replace(/^https:\/\//, ''), w / 2, 1420);
          ctx.fillText('Stick this at your shop · Powered by Apointo', w / 2, 1465);
          setPreview(canvas.toDataURL('image/png'));
        };
        img.src = qr;
      }
    );
  }, [address, bookingUrl, businessName, category, codeLabel, phone]);

  const download = () => {
    if (!preview) return;
    const a = document.createElement('a');
    a.href = preview;
    a.download = `${slug}-apointo-qr.png`;
    a.click();
  };

  const share = async () => {
    if (!preview) return;
    const blob = await (await fetch(preview)).blob();
    const file = new File([blob], `${slug}-apointo-qr.png`, { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: businessName, text: `Book at ${businessName}` });
      return;
    }
    download();
  };

  return (
    <div className="space-y-3">
      <canvas ref={canvasRef} className="hidden" />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={`${businessName} QR sticker`} className="mx-auto w-full max-w-xs rounded-xl border bg-white" />
      ) : (
        <div className="h-64 rounded-xl bg-gray-100" />
      )}
      {codeLabel ? (
        <p className="text-center font-mono text-sm font-semibold tracking-wide">{codeLabel}</p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={download}>
          <Download size={16} className="mr-1" /> Download
        </Button>
        <Button variant="outline" onClick={share}>
          <Share2 size={16} className="mr-1" /> Save to phone
        </Button>
      </div>
    </div>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

export function FavoriteButton({
  slug,
  appearance = 'button',
}: {
  slug: string;
  appearance?: 'button' | 'pill';
}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(readFavoriteSlugs().includes(slug));
  }, [slug]);

  const toggle = () => {
    const next = toggleFavoriteSlug(slug);
    setOn(next.includes(slug));
  };

  if (appearance === 'pill') {
    return (
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-2 text-sm ${
          on
            ? 'border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200'
            : 'bg-white dark:bg-[#16181d]'
        }`}
      >
        <Bookmark size={14} />
        {on ? 'Saved' : 'Save'}
      </button>
    );
  }

  return (
    <Button
      variant={on ? 'primary' : 'outline'}
      size="sm"
      onClick={toggle}
    >
      <Bookmark size={16} className="mr-1" />
      {on ? 'Saved' : 'Make favourite'}
    </Button>
  );
}
