import {
  formatReceiptInr,
  type ReceiptView,
} from './receipt-format';

function pdfEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function dashLine(): string {
  return '-'.repeat(32);
}

export function receiptTextLines(receipt: ReceiptView): string[] {
  const lines: string[] = [
    'APOINTO RECEIPT',
    receipt.businessName,
  ];
  if (receipt.location) lines.push(receipt.location);
  lines.push(dashLine());
  lines.push(`Receipt No: ${receipt.receiptDisplay}`);
  lines.push(`Date: ${receipt.dateLabel}`);
  lines.push(`Customer: ${receipt.customerName}`);
  lines.push(`Phone: ${receipt.customerPhone}`);
  lines.push(dashLine());
  lines.push('Item                    Price');
  for (const item of receipt.items) {
    const price = formatReceiptInr(item.price);
    const name = item.name.length > 18 ? `${item.name.slice(0, 17)}...` : item.name;
    lines.push(`${name.padEnd(20)}${price}`);
  }
  lines.push(dashLine());
  lines.push(`Total ${formatReceiptInr(receipt.total)}`);
  lines.push(`Payment: ${receipt.paymentModeLabel}`);
  lines.push(receipt.paid ? 'PAID' : 'UNPAID');
  lines.push(dashLine());
  lines.push('Thank you for booking with us!');
  return lines;
}

/** Minimal text PDF sized for ~80mm thermal paper. No extra dependencies. */
export function buildReceiptPdfBlob(receipt: ReceiptView): Blob {
  const lines = receiptTextLines(receipt);
  const pageWidth = 226; // 80mm at 72dpi
  const fontSize = 9;
  const lineHeight = 12;
  const top = 22;
  const pageHeight = Math.max(340, top + 20 + lines.length * lineHeight);

  const ops: string[] = ['BT', `/F1 ${fontSize} Tf`, `18 ${pageHeight - top} Td`];
  lines.forEach((line, index) => {
    ops.push(`(${pdfEscape(line)}) Tj`);
    if (index < lines.length - 1) ops.push(`0 -${lineHeight} Td`);
  });
  ops.push('ET');
  const stream = ops.join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj`,
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier >> endobj',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}
