import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminError, requirePermission, writeAudit } from '@/lib/admin';
import { campaignRecipients, type CampaignAudience } from '@/lib/admin-campaigns';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await requirePermission('campaigns', 'EDIT');
    const campaign = await prisma.campaign.findUnique({ where: { id: params.id } });
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'send';

    const recipients = await campaignRecipients(campaign.audience as CampaignAudience);

    if (action === 'whatsapp') {
      const rows = ['name,phone,role', ...recipients.map((r) => `${csv(r.name)},${r.phone},${r.role}`)].join('\n');
      return new NextResponse(rows, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="apointo-whatsapp-${campaign.audience.toLowerCase()}.csv"`,
        },
      });
    }

    let sent = 0;
    for (const person of recipients) {
      if (!person.email) continue;
      try {
        await sendEmail({
          to: person.email,
          subject: campaign.subject,
          html: `<p>Hi ${person.name},</p>${campaign.body}`,
          text: campaign.body.replace(/<[^>]+>/g, ' '),
        });
        sent += 1;
      } catch (error) {
        console.error('[Campaign] send failed', person.email, error);
      }
    }

    const updated = await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'SENT', sentAt: new Date(), recipientCount: sent },
    });

    await writeAudit({
      actorId: staff.session.id,
      action: 'campaign.send',
      targetType: 'campaign',
      targetId: campaign.id,
      metadata: { sent },
    });

    return NextResponse.json({ campaign: updated, sent });
  } catch (error) {
    return adminError(error);
  }
}

function csv(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
