import { NextRequest, NextResponse } from 'next/server';
import { adminError, requirePermission } from '@/lib/admin';
import { buildAdminAnalytics, parseAnalyticsRange } from '@/lib/admin-analytics';
import { emailFromAddress, isEmailConfigured } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requirePermission('dashboard', 'READ');
    const range = parseAnalyticsRange(req.nextUrl.searchParams.get('range'));
    const data = await buildAdminAnalytics(range);
    return NextResponse.json({
      ...data,
      email: { configured: isEmailConfigured(), from: emailFromAddress() },
    });
  } catch (error) {
    return adminError(error);
  }
}
