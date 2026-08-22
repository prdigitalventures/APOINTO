/** Production origin used in owner copy-paste UIs when `window` is unavailable. */
export const PUBLIC_APP_ORIGIN = 'https://www.apointo.online';

/** Query flag on the booking URL owners paste into Google Business Profile. */
export const GOOGLE_BOOK_SOURCE = 'google';

export function publicProfilePath(slug: string): string {
  return `/${slug}`;
}

export function bookingPath(slug: string): string {
  return `/${slug}/book`;
}

function originBase(origin?: string): string {
  const raw = (origin || PUBLIC_APP_ORIGIN).trim().replace(/\/$/, '');
  return raw || PUBLIC_APP_ORIGIN;
}

/** Stable, public booking URL (services + slots, no login required to browse). */
export function canonicalBookingUrl(slug: string, origin?: string): string {
  return `${originBase(origin)}${bookingPath(slug)}`;
}

/** Same booking page with a source tag so Google Book taps can be attributed later. */
export function googleBookUrl(slug: string, origin?: string): string {
  return `${canonicalBookingUrl(slug, origin)}?src=${GOOGLE_BOOK_SOURCE}`;
}

export function clientOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return PUBLIC_APP_ORIGIN;
}
