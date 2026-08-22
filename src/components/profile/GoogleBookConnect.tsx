'use client';

import { useState } from 'react';
import { CalendarCheck, Check, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { canonicalBookingUrl, clientOrigin, googleBookUrl } from '@/lib/booking-url';

interface GoogleBookConnectProps {
  slug: string;
  businessName: string;
  linkedAt: string | Date | null;
  onLinkedChange: (linkedAt: string | null) => Promise<void>;
}

export function GoogleBookConnect({ slug, businessName, linkedAt, onLinkedChange }: GoogleBookConnectProps) {
  const origin = clientOrigin();
  const bookingUrl = canonicalBookingUrl(slug, origin);
  const googleUrl = googleBookUrl(slug, origin);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const linked = Boolean(linkedAt);

  const copy = async () => {
    await navigator.clipboard.writeText(googleUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleLinked = async (next: boolean) => {
    setSaving(true);
    setError('');
    try {
      await onLinkedChange(next ? new Date().toISOString() : null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="google-book" className="scroll-mt-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-[#16181d]">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <CalendarCheck size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Add Book on Google</h2>
          <p className="mt-1 text-xs text-gray-500">
            Connect this shop so people who find {businessName} on Google can tap Book and land on Apointo — the same
            idea as Call using your phone number.
          </p>
        </div>
      </div>

      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Your Apointo booking URL</p>
      <p className="mt-1 break-all font-mono text-sm text-indigo-700 dark:text-indigo-300">{googleUrl}</p>
      <p className="mt-1 text-xs text-gray-500">
        Public page: {origin}/{slug}. Booking (services and times, no login to browse): {bookingUrl}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check size={16} className="mr-1" /> : <Copy size={16} className="mr-1" />}
          {copied ? 'Copied' : 'Copy Book URL'}
        </Button>
        <a
          href={googleUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300"
        >
          <ExternalLink size={16} className="mr-1" /> Preview
        </a>
      </div>

      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
        <li>Open Google Business Profile (business.google.com) and sign in as the owner of this location.</li>
        <li>
          Go to the listing for <span className="font-medium text-gray-900 dark:text-gray-100">{businessName}</span>.
        </li>
        <li>
          Add or edit the <span className="font-medium">Website</span> or <span className="font-medium">Appointment / Book online</span>{' '}
          link and paste the URL above.
        </li>
        <li>
          Save. Call still uses your shop phone. Book on Google opens this Apointo page so customers can pick a service
          and time.
        </li>
      </ol>

      <p className="mt-3 text-xs text-gray-500">
        Apointo is not a Reserve with Google partner, so we cannot inject a native Maps chip automatically. Pasting this
        URL is the supported way to add Book today. Each of your shops has its own URL — switch businesses above to copy
        the matching link.
      </p>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {linked ? (
        <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
          Marked as added on Google for this shop.
          <button
            type="button"
            className="ml-2 font-medium underline"
            disabled={saving}
            onClick={() => toggleLinked(false)}
          >
            Undo
          </button>
        </div>
      ) : (
        <Button className="mt-4 w-full" onClick={() => toggleLinked(true)} disabled={saving}>
          {saving ? 'Saving...' : "I've added this Book URL on Google"}
        </Button>
      )}
    </div>
  );
}
