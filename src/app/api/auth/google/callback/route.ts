import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { setSessionCookie, toSessionUser, upsertGoogleUser, type UserRole } from '@/lib/auth';
import { appBaseUrl, googleRedirectUri } from '@/lib/app-url';
import {
  authDestination,
  authenticatedDestination,
  parseAuthIntentRole,
} from '@/lib/auth-intent';

export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'apointo-dev-secret');

function loginError(
  message: string,
  role: UserRole = 'CUSTOMER',
  entry: 'login' | 'register' = 'login'
) {
  const url = new URL(`/${entry}`, appBaseUrl());
  url.searchParams.set('role', role.toLowerCase());
  url.searchParams.set('error', message);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = googleRedirectUri();

  if (!clientId || !clientSecret) {
    return loginError(
      'Google sign-in is temporarily unavailable. Please use email and password or try again later.'
    );
  }

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const cookieStore = await cookies();
  const expectedState = cookieStore.get('google_oauth_state')?.value;
  const role = parseAuthIntentRole(cookieStore.get('google_oauth_role')?.value) as UserRole;
  const next = authDestination(cookieStore.get('google_oauth_next')?.value, role);
  const entry = cookieStore.get('google_oauth_entry')?.value === 'register' ? 'register' : 'login';

  cookieStore.delete('google_oauth_state');
  cookieStore.delete('google_oauth_role');
  cookieStore.delete('google_oauth_next');
  cookieStore.delete('google_oauth_entry');

  if (!code || !state || !expectedState || state !== expectedState) {
    return loginError('Google sign-in was cancelled or expired. Please try again.', role, entry);
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokenPayload = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenRes.ok || !tokenPayload.access_token) {
    console.error('[Google OAuth] token exchange failed', {
      status: tokenRes.status,
      error: tokenPayload.error,
      description: tokenPayload.error_description,
    });
    if (tokenPayload.error === 'invalid_client') {
      return loginError(
        'Google could not verify this app. Reset the client secret in Google Cloud and add the new value in Railway as GOOGLE_CLIENT_SECRET.',
        role,
        entry
      );
    }
    return loginError('Google sign-in failed. Please try again.', role, entry);
  }

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
  });
  if (!profileRes.ok) {
    return loginError('Could not read your Google profile. Please try again.', role, entry);
  }

  const profile = (await profileRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };

  if (!profile.sub || !profile.email) {
    return loginError(
      'Google did not share an email address. Please allow email access or sign up with email.',
      role,
      entry
    );
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
        next,
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
    const dest = authenticatedDestination(next, role, result.user.role as UserRole);
    return NextResponse.redirect(new URL(dest, appBaseUrl()));
  } catch (error) {
    return loginError((error as Error).message, role, entry);
  }
}
