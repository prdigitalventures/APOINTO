export function makeReferralCode(userId: string): string {
  const compact = userId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  return `APO${compact || 'USER'}`;
}

export function appOrigin(): string {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.apointo.online';
}
