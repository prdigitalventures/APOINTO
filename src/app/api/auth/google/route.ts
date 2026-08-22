import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSecretToken } from '@/lib/identity';
import { appBaseUrl, googleRedirectUri } from '@/lib/app-url';
import { authDestination, parseAuthIntentRole } from '@/lib/auth-intent';

export const dynamic = 'force-dynamic';

function authErrorUrl(role: 'OWNER' | 'CUSTOMER', entry: 'login' | 'register', message: string) {
  const url = new URL(`/${entry}`, appBaseUrl());
  url.searchParams.set('role', role.toLowerCase());
  url.searchParams.set('error', message);
  return url;
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = googleRedirectUri();
  const role = parseAuthIntentRole(req.nextUrl.searchParams.get('role'));
  const next = authDestination(req.nextUrl.searchParams.get('next'), role);
  const entry = req.nextUrl.searchParams.get('from') === 'register' ? 'register' : 'login';

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      authErrorUrl(
        role,
        entry,
        'Google sign-in is temporarily unavailable. Please use email and password or try again later.'
      )
    );
  }

  const state = createSecretToken();
  const cookieStore = await cookies();
  cookieStore.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15,
    path: '/',
  });
  cookieStore.set('google_oauth_role', role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15,
    path: '/',
  });
  cookieStore.set('google_oauth_next', next, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15,
    path: '/',
  });
  cookieStore.set('google_oauth_entry', entry, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15,
    path: '/',
  });

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');
  console.info('[Google OAuth] start', { redirectUri, clientIdPrefix: clientId.slice(0, 20) });
  return NextResponse.redirect(url);
}
