import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminError, requirePermission, writeAudit } from '@/lib/admin';
import { type CampaignAudience } from '@/lib/admin-campaigns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requirePermission('campaigns', 'READ');
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { createdBy: { select: { name: true, email: true } } },
    });
    return NextResponse.json({ campaigns });
  } catch (error) {
    return adminError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const staff = await requirePermission('campaigns', 'EDIT');
    const body = await req.json();
    const name = String(body.name || '').trim();
    const subject = String(body.subject || '').trim();
    const html = String(body.body || '').trim();
    const audience = (body.audience || 'ALL') as CampaignAudience;
    if (!name || !subject || !html) {
      return NextResponse.json({ error: 'Name, subject, and message are required' }, { status: 400 });
    }
    if (!['ALL', 'OWNERS', 'CUSTOMERS'].includes(audience)) {
      return NextResponse.json({ error: 'Invalid audience' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        subject,
        body: html,
        audience,
        createdById: staff.session.id,
      },
    });

    await writeAudit({
      actorId: staff.session.id,
      action: 'campaign.create',
      targetType: 'campaign',
      targetId: campaign.id,
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    return adminError(error);
  }
}
