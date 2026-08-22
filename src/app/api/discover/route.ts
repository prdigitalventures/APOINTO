import { NextRequest, NextResponse } from 'next/server';
import { discoverBusinesses } from '@/lib/customer-assistant';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || undefined;
  const category = searchParams.get('category') || undefined;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  const businesses = await discoverBusinesses({
    city,
    category,
    latitude: lat ? parseFloat(lat) : undefined,
    longitude: lng ? parseFloat(lng) : undefined,
  });

  return NextResponse.json({ businesses });
}
