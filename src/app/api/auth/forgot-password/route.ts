import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '');
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    const result = await requestPasswordReset(email);
    return NextResponse.json({
      ok: true,
      message: 'If that email is registered, we sent a password reset link.',
      ...(process.env.NODE_ENV !== 'production' && result.resetUrl ? { resetUrl: result.resetUrl } : {}),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
