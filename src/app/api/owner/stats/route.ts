import { NextRequest, NextResponse } from 'next/server';
import { buildOwnerAnalytics, parseOwnerAnalyticsRange } from '@/lib/owner-analytics';
import { assertBusinessInScope, requireShopAccess, shopErrorResponse } from '@/lib/shop-access';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireShopAccess('home', 'READ');
    const businessId = req.nextUrl.searchParams.get('businessId');
    const range = parseOwnerAnalyticsRange(req.nextUrl.searchParams.get('range'));

    if (businessId) {
      await assertBusinessInScope(ctx, businessId);
    }

    const data = await buildOwnerAnalytics(ctx.ownerId, businessId, range);
    return NextResponse.json(data);
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
