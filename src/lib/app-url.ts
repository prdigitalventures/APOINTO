/** Canonical production callback. Must match Google Cloud Authorized redirect URIs exactly. */
export const PRODUCTION_GOOGLE_REDIRECT_URI =
  'https://www.apointo.online/api/auth/google/callback';

export const LOCAL_GOOGLE_REDIRECT_URI =
  'http://localhost:3000/api/auth/google/callback';

export function appBaseUrl(): string {
  const raw =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://www.apointo.online';
  return cleanUrl(raw);
}

function cleanUrl(raw: string): string {
  return raw.trim().replace(/^['"]|['"]$/g, '').replace(/\/$/, '');
}

export function googleRedirectUri(): string {
  const fromEnv = process.env.GOOGLE_REDIRECT_URI
    ? cleanUrl(process.env.GOOGLE_REDIRECT_URI)
    : '';

  if (fromEnv && /localhost|127\.0\.0\.1/.test(fromEnv)) {
    return fromEnv.endsWith('/api/auth/google/callback')
      ? fromEnv
      : `${fromEnv}/api/auth/google/callback`;
  }

  // Never send a Railway/internal host to Google — that causes Error 400 redirect_uri_mismatch.
  return PRODUCTION_GOOGLE_REDIRECT_URI;
}

