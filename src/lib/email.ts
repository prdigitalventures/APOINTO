import { appBaseUrl } from './app-url';

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = {
  sent: boolean;
  provider: 'resend' | 'smtp' | 'log';
};

function fromAddress() {
  return process.env.EMAIL_FROM || process.env.SMTP_FROM || 'Apointo <noreply@apointo.online>';
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS));
}

export function emailFromAddress() {
  return fromAddress();
}

function resendUserMessage(status: number, body: string) {
  const lower = body.toLowerCase();
  if (/not verified|unverified domain|domain is not verified/.test(lower)) {
    return 'Resend rejected the from-address because the sending domain is not verified. Add apointo.online in the Resend dashboard, then set EMAIL_FROM to a mailbox on that domain.';
  }
  if (status === 401 || /unauthorized|invalid.?api.?key/.test(lower)) {
    return 'Resend rejected the API key. Check RESEND_API_KEY on Railway.';
  }
  if (status === 422 || status === 403) {
    return 'Resend could not send this email. Confirm the domain is verified and EMAIL_FROM matches it.';
  }
  return 'Could not send email right now. Please try again.';
}

export async function sendEmail(message: EmailMessage): Promise<SendEmailResult> {
  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[Email] Resend failed:', res.status, body);
      throw new Error(resendUserMessage(res.status, body));
    }
    return { sent: true, provider: 'resend' };
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: fromAddress(),
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    return { sent: true, provider: 'smtp' };
  }

  console.warn('[Email] No RESEND_API_KEY or SMTP_* configured. Email was not sent.');
  console.warn(`[Email] To: ${message.to}`);
  console.warn(`[Email] Subject: ${message.subject}`);
  if (message.text) console.warn(`[Email] ${message.text}`);
  return { sent: false, provider: 'log' };
}

export function assertEmailDelivered(result: SendEmailResult) {
  if (result.sent) return result;
  throw Object.assign(
    new Error('Error: Unable to send. Link Resend on Railway with RESEND_API_KEY and a verified EMAIL_FROM.'),
    { status: 502 }
  );
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${appBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const result = await sendEmail({
    to,
    subject: 'Verify your Apointo email',
    text: `Confirm your email to start booking appointments: ${url}`,
    html: `<p>Welcome to Apointo.</p><p>Please verify your email so you can book appointments.</p><p><a href="${url}">Verify email</a></p><p>If the button does not work, copy this link:<br/>${url}</p>`,
  });
  if (!result.sent) {
    console.warn(`[Email] Verification URL (dev fallback): ${url}`);
  }
  return { ...result, url };
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${appBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const result = await sendEmail({
    to,
    subject: 'Reset your Apointo password',
    text: `Reset your password using this link (valid for 1 hour): ${url}`,
    html: `<p>We received a request to reset your Apointo password.</p><p><a href="${url}">Choose a new password</a></p><p>This link expires in 1 hour. If you did not request it, you can ignore this email.</p><p>${url}</p>`,
  });
  if (!result.sent) {
    console.warn(`[Email] Password reset URL (dev fallback): ${url}`);
  }
  return { ...result, url };
}

export async function sendShopAssignedEmail(
  to: string,
  opts: { ownerName: string; businessName: string; slug: string }
) {
  const loginUrl = `${appBaseUrl()}/login?role=owner`;
  const dashboardUrl = `${appBaseUrl()}/owner`;
  const publicUrl = `${appBaseUrl()}/${opts.slug}`;
  return sendEmail({
    to,
    subject: `${opts.businessName} is ready on Apointo`,
    text: `Hi ${opts.ownerName}, your Apointo booking page for ${opts.businessName} is live: ${publicUrl}. Log in at ${loginUrl} and open ${dashboardUrl}.`,
    html: `<p>Hi ${opts.ownerName},</p><p>Your Apointo booking page for <strong>${opts.businessName}</strong> is ready.</p><p><a href="${publicUrl}">Public booking page</a></p><p><a href="${loginUrl}">Log in</a> then open your <a href="${dashboardUrl}">owner dashboard</a>.</p>`,
  });
}

export async function sendAccountCreatedEmail(
  to: string,
  opts: { name: string; email: string; password: string; role: string }
) {
  const loginUrl =
    opts.role === 'OWNER' ? `${appBaseUrl()}/login?role=owner` : `${appBaseUrl()}/login`;
  const roleLabel = opts.role === 'OWNER' ? 'business owner' : 'customer';
  return sendEmail({
    to,
    subject: 'Your Apointo account is ready',
    text: `Hi ${opts.name}, your Apointo ${roleLabel} account is created.\nLogin: ${loginUrl}\nEmail: ${opts.email}\nTemporary password: ${opts.password}\nPlease log in and change this password.`,
    html: `<p>Hi ${opts.name},</p><p>Your Apointo <strong>${roleLabel}</strong> account is created.</p><p><a href="${loginUrl}">Log in</a></p><p>Email: <strong>${opts.email}</strong><br/>Temporary password: <strong>${opts.password}</strong></p><p>Please log in and change this password after you sign in.</p>`,
  });
}

export async function sendStaffInviteEmail(to: string, opts: { name: string; resetUrl: string }) {
  return sendEmail({
    to,
    subject: 'Your Apointo admin access',
    text: `Hi ${opts.name}, you have been invited to the Apointo admin dashboard. Set your password: ${opts.resetUrl}`,
    html: `<p>Hi ${opts.name},</p><p>You have been invited to the Apointo admin dashboard.</p><p><a href="${opts.resetUrl}">Set your password</a></p><p>Then open <a href="${appBaseUrl()}/admin">${appBaseUrl()}/admin</a>.</p>`,
  });
}
