import { NextResponse } from 'next/server';
import { adminError, requireStaff, writeAudit } from '@/lib/admin';
import { assertEmailDelivered, sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const staff = await requireStaff();
    if (!staff.session.email) {
      return NextResponse.json({ error: 'Your admin account has no email address.' }, { status: 400 });
    }
    const mail = await sendEmail({
      to: staff.session.email,
      subject: 'Apointo email test',
      text: 'This is a test from the Apointo admin dashboard. If you received it, Resend is linked.',
      html: '<p>This is a test from the Apointo admin dashboard.</p><p>If you received it, Resend is linked.</p>',
    });
    assertEmailDelivered(mail);
    await writeAudit({
      actorId: staff.session.id,
      action: 'email.test',
      targetType: 'user',
      targetId: staff.session.id,
    });
    return NextResponse.json({ ok: true, emailSent: true });
  } catch (error) {
    return adminError(error);
  }
}
