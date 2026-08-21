export type AuthIntentRole = 'OWNER' | 'CUSTOMER';

export const OWNER_ONBOARDING_PATH = '/owner?onboarding=1';

export function parseAuthIntentRole(value: string | null | undefined): AuthIntentRole {
  return value?.toLowerCase() === 'owner' ? 'OWNER' : 'CUSTOMER';
}

export function safeInternalPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return null;
  }
  return value;
}

export function authDestination(
  value: string | null | undefined,
  role: AuthIntentRole
): string {
  const path = safeInternalPath(value);
  if (role === 'OWNER') {
    return path && (path === '/owner' || path.startsWith('/owner?') || path.startsWith('/owner/'))
      ? path
      : OWNER_ONBOARDING_PATH;
  }
  return path || '/customer';
}

export function authenticatedDestination(
  value: string | null | undefined,
  intentRole: AuthIntentRole,
  accountRole: AuthIntentRole
): string {
  if (intentRole === 'OWNER') return authDestination(value, intentRole);
  if (accountRole === 'OWNER') return '/owner';
  return authDestination(value, intentRole);
}
