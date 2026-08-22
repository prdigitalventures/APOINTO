import { prisma } from './db';
import { formatEmployeeCode, randomStaffPassword } from './staff-code-format';

export { formatEmployeeCode, randomStaffPassword };

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSuffix(length = 5): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** Stored as PRST + YYMM + 5 chars. Display: PR ST 2608ABC12 */
export async function allocateEmployeeCode(createdAt = new Date()): Promise<string> {
  const yy = String(createdAt.getFullYear()).slice(-2);
  const mm = String(createdAt.getMonth() + 1).padStart(2, '0');
  for (let attempt = 0; attempt < 16; attempt++) {
    const code = `PRST${yy}${mm}${randomSuffix()}`;
    const exists = await prisma.staff.findUnique({ where: { employeeCode: code } });
    if (!exists) return code;
  }
  return `PRST${yy}${mm}${Date.now().toString(36).slice(-5).toUpperCase()}`;
}
