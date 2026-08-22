import { prisma } from './db';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSuffix(length = 5): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export async function allocateUniqueCode(createdAt = new Date()): Promise<string> {
  const yy = String(createdAt.getFullYear()).slice(-2);
  const mm = String(createdAt.getMonth() + 1).padStart(2, '0');
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = `PR${yy}${mm}${randomSuffix()}`;
    const exists = await prisma.business.findUnique({ where: { uniqueCode: code } });
    if (!exists) return code;
  }
  return `PR${yy}${mm}${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

export async function ensureBusinessCode(
  business: { id: string; uniqueCode: string | null; createdAt: Date }
): Promise<string> {
  if (business.uniqueCode) return business.uniqueCode;
  const uniqueCode = await allocateUniqueCode(business.createdAt);
  await prisma.business.update({ where: { id: business.id }, data: { uniqueCode } });
  return uniqueCode;
}
