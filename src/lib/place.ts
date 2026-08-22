export function formatBusinessCode(code: string): string {
  const compact = code.replace(/\s+/g, '').toUpperCase();
  if (compact.length < 9) return compact;
  return `${compact.slice(0, 2)} ${compact.slice(2, 6)} ${compact.slice(6)}`;
}

export function googleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const FAVORITES_KEY = 'apointo-favorite-businesses';

export function readFavoriteSlugs(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteSlug(slug: string): string[] {
  const current = readFavoriteSlugs();
  const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}
