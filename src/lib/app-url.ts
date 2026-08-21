export function appBaseUrl(): string {
  const raw =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://www.apointo.online';
  return raw.replace(/\/$/, '');
}

export function googleRedirectUri(): string {
  return process.env.GOOGLE_REDIRECT_URI || `${appBaseUrl()}/api/auth/google/callback`;
}
