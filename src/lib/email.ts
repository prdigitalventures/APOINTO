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
      throw new Error('Could not send email right now. Please try again.');
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
