export type CrmStatus = 'NEW' | 'REGULAR' | 'INACTIVE';

const INACTIVE_DAYS = 30;

function digits(phone: string): string {
  const raw = phone.replace(/\D/g, '');
  return raw.length >= 10 ? raw.slice(-10) : raw;
}

export function crmStatus(visitCount: number, lastBookingDate: Date | null): CrmStatus {
  if (!lastBookingDate) return 'NEW';
  const ageMs = Date.now() - lastBookingDate.getTime();
  if (ageMs > INACTIVE_DAYS * 24 * 60 * 60 * 1000) return 'INACTIVE';
  if (visitCount >= 2) return 'REGULAR';
  return 'NEW';
}

export function applyStatusOverride(
  auto: CrmStatus,
  override?: string | null
): CrmStatus {
  if (override === 'NEW' || override === 'REGULAR' || override === 'INACTIVE') {
    return override;
  }
  return auto;
}

export function whatsappLink(phone: string, text: string): string {
  const ten = digits(phone);
  const intl = ten.length === 10 ? `91${ten}` : ten;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

export function telLink(phone: string): string {
  const ten = digits(phone);
  return ten.length === 10 ? `tel:+91${ten}` : `tel:${phone}`;
}
