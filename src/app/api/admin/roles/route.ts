import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminError, ensureDefaultRoles, requirePermission } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requirePermission('team', 'READ');
    await ensureDefaultRoles();
    const roles = await prisma.role.findMany({
      include: { permissions: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ roles });
  } catch (error) {
    return adminError(error);
  }
}
