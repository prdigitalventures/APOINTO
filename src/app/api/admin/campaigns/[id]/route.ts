import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminError, requirePermission, writeAudit } from '@/lib/admin';
import { campaignRecipients, type CampaignAudience } from '@/lib/admin-campaigns';
import { sendEmail, isEmailConfigured } from '@/lib/email';

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

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: 'Error: Unable to send. Link Resend on Railway with RESEND_API_KEY.' },
        { status: 502 }
      );
    }

    let sent = 0;
    let failed = 0;
    for (const person of recipients) {
      if (!person.email) continue;
      try {
        const mail = await sendEmail({
          to: person.email,
          subject: campaign.subject,
          html: `<p>Hi ${person.name},</p>${campaign.body}`,
          text: campaign.body.replace(/<[^>]+>/g, ' '),
        });
        if (mail.sent) sent += 1;
        else failed += 1;
      } catch (error) {
        failed += 1;
        console.error('[Campaign] send failed', person.email, error);
      }
    }

    if (sent < 1) {
      return NextResponse.json({ error: 'Error: Unable to send', sent: 0, failed }, { status: 502 });
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
