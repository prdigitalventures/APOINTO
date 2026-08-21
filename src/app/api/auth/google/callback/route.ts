import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { setSessionCookie, toSessionUser, upsertGoogleUser, type UserRole } from '@/lib/auth';
import { appBaseUrl, googleRedirectUri } from '@/lib/app-url';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'apointo-dev-secret');

function loginError(_req: NextRequest, message: string) {
  const url = new URL('/login', appBaseUrl());
  url.searchParams.set('error', message);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = googleRedirectUri();

  if (!clientId || !clientSecret) {
    return loginError(
      req,
      'Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI on the server.'
    );
  }

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const cookieStore = await cookies();
  const expectedState = cookieStore.get('google_oauth_state')?.value;
  const role = (cookieStore.get('google_oauth_role')?.value === 'OWNER' ? 'OWNER' : 'CUSTOMER') as UserRole;

  cookieStore.delete('google_oauth_state');
  cookieStore.delete('google_oauth_role');

  if (!code || !state || !expectedState || state !== expectedState) {
    return loginError(req, 'Google sign-in was cancelled or expired. Please try again.');
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const detail = await tokenRes.text();
    console.error('[Google OAuth] token exchange failed', tokenRes.status, detail);
    return loginError(req, 'Google sign-in failed. Please try again.');
  }

  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) {
    return loginError(req, 'Google sign-in failed. Please try again.');
  }

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) {
    return loginError(req, 'Could not read your Google profile. Please try again.');
  }

  const profile = (await profileRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };

  if (!profile.sub || !profile.email) {
    return loginError(req, 'Google did not share an email address. Please allow email access or sign up with email.');
  }

  try {
    const result = await upsertGoogleUser({
      googleId: profile.sub,
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      role,
    });

    if (result.needsPhone || !result.user) {
      const pending = await new SignJWT({
        googleId: profile.sub,
        email: profile.email,
        name: profile.name || profile.email.split('@')[0],
        role,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('15m')
        .sign(JWT_SECRET);

      cookieStore.set('google_pending', pending, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 15,
        path: '/',
      });
      return NextResponse.redirect(new URL('/complete-google', appBaseUrl()));
    }

    await setSessionCookie(toSessionUser(result.user));
    const dest = result.user.role === 'OWNER' ? '/owner' : '/customer';
    return NextResponse.redirect(new URL(dest, appBaseUrl()));
  } catch (error) {
    return loginError(req, (error as Error).message);
  }
}
