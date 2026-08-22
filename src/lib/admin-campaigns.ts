import { prisma } from './db';

export type CampaignAudience = 'ALL' | 'OWNERS' | 'CUSTOMERS';

export function audienceWhere(audience: CampaignAudience) {
  if (audience === 'OWNERS') return { role: 'OWNER' as const, isActive: true };
  if (audience === 'CUSTOMERS') return { role: 'CUSTOMER' as const, isActive: true };
  return { role: { in: ['OWNER', 'CUSTOMER'] }, isActive: true };
}

export async function campaignRecipients(audience: CampaignAudience) {
  return prisma.user.findMany({
    where: audienceWhere(audience),
    select: { id: true, name: true, email: true, phone: true, role: true },
    orderBy: { createdAt: 'desc' },
  });
}
