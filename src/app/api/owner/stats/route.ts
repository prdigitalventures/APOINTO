import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { buildOwnerAnalytics, parseOwnerAnalyticsRange } from '@/lib/owner-analytics';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const businessId = req.nextUrl.searchParams.get('businessId');
  const range = parseOwnerAnalyticsRange(req.nextUrl.searchParams.get('range'));

  if (businessId) {
    const owned = await prisma.business.findFirst({
      where: { id: businessId, ownerId: session.id },
      select: { id: true },
    });
    if (!owned) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  const data = await buildOwnerAnalytics(session.id, businessId, range);
  return NextResponse.json(data);
}
