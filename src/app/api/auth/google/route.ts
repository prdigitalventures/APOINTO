import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSecretToken } from '@/lib/identity';
import { appBaseUrl, googleRedirectUri } from '@/lib/app-url';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = googleRedirectUri();
  const role = req.nextUrl.searchParams.get('role') === 'OWNER' ? 'OWNER' : 'CUSTOMER';
  const next = req.nextUrl.searchParams.get('next') || '';

  if (!clientId || !clientSecret) {
    const login = new URL('/login', appBaseUrl());
    login.searchParams.set(
      'error',
      'Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI on the server.'
    );
    return NextResponse.redirect(login);
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
  if (next) {
    cookieStore.set('google_oauth_next', next, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
      path: '/',
    });
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');
  return NextResponse.redirect(url);
}
