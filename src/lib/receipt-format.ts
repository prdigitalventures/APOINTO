export const RECEIPT_DISPLAY_PREFIX = 'PR INV';

export type ReceiptItem = {
  name: string;
  price: number;
};

export type ReceiptView = {
  bookingId: string;
  receiptNumber: string;
  receiptDisplay: string;
  businessName: string;
  location: string | null;
  dateLabel: string;
  customerName: string;
  customerPhone: string;
  items: ReceiptItem[];
  total: number;
  paymentMode: string | null;
  paymentModeLabel: string;
  paid: boolean;
};

export function compactReceiptCode(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase();
}

/** Stored value is PR + YYMM + 5 chars (e.g. PR2608ABC12). Display is always `PR INV <suffix>`. */
export function formatReceiptDisplay(stored: string): string {
  const compact = compactReceiptCode(stored);
  const suffix = compact.startsWith('PR') ? compact.slice(2) : compact;
  return `${RECEIPT_DISPLAY_PREFIX} ${suffix}`;
}

export function formatReceiptInr(amount: number): string {
  return `INR ${amount.toFixed(2)}`;
}

export function formatReceiptDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

export function paymentModeLabel(mode: string | null | undefined): string {
  if (!mode || !mode.trim()) return 'Offline';
  const key = mode.trim().toLowerCase();
  const labels: Record<string, string> = {
    offline: 'Offline',
    online: 'Online',
    upi: 'UPI',
    cash: 'Cash',
    card: 'Card',
  };
  return labels[key] || mode.trim();
}

export function receiptPublicPath(stored: string): string {
  return `/r/${encodeURIComponent(compactReceiptCode(stored))}`;
}

export function receiptDownloadFilename(stored: string): string {
  return `apointo-receipt-${compactReceiptCode(stored)}.pdf`;
}

export function whatsappShareDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`;
  return digits;
}

export function receiptWhatsAppUrl(phone: string, text: string): string {
  const intl = whatsappShareDigits(phone);
  const path = intl ? `/${intl}` : '';
  return `https://wa.me${path}?text=${encodeURIComponent(text)}`;
}

export function buildReceiptShareText(receipt: ReceiptView, viewUrl: string): string {
  const service = receipt.items.map((item) => item.name).join(', ') || 'Service';
  return [
    `Apointo receipt from ${receipt.businessName}`,
    `Receipt No: ${receipt.receiptDisplay}`,
    `Service: ${service}`,
    `Total: ${formatReceiptInr(receipt.total)}`,
    `Status: ${receipt.paid ? 'PAID' : 'UNPAID'}`,
    `View: ${viewUrl}`,
  ].join('\n');
}

type BookingLike = {
  id: string;
  receiptNumber: string | null;
  paidAt: Date | string | null;
  paymentMode: string | null;
  date: Date | string;
  customerName: string;
  customerPhone: string;
  service: { name: string; price: number };
  business: { name: string; location: string | null };
};

export function toReceiptView(booking: BookingLike): ReceiptView | null {
  if (!booking.receiptNumber) return null;
  return {
    bookingId: booking.id,
    receiptNumber: booking.receiptNumber,
    receiptDisplay: formatReceiptDisplay(booking.receiptNumber),
    businessName: booking.business.name,
    location: booking.business.location,
    dateLabel: formatReceiptDate(booking.paidAt || booking.date),
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    items: [{ name: booking.service.name, price: booking.service.price }],
    total: booking.service.price,
    paymentMode: booking.paymentMode,
    paymentModeLabel: paymentModeLabel(booking.paymentMode),
    paid: Boolean(booking.paidAt),
  };
}
