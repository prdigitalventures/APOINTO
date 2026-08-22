import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminError, requirePermission } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requirePermission('team', 'READ');
    const audits = await prisma.adminAudit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 80,
      include: { actor: { select: { name: true, email: true } } },
    });
    return NextResponse.json({ audits });
  } catch (error) {
    return adminError(error);
  }
}
