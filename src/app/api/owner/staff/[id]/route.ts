import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { formatEmployeeCode } from '@/lib/staff-code';
import { requireShopAccess, shopErrorResponse } from '@/lib/shop-access';
import {
  defaultStaffPrivileges,
  parseShopPrivileges,
  serializeShopPrivileges,
} from '@/lib/shop-privileges';

function presentStaff(row: {
  id: string;
  name: string;
  role: string | null;
  isActive: boolean;
  phone: string | null;
  email: string | null;
  bio: string | null;
  photo: string | null;
  employeeCode: string | null;
  userId: string | null;
  privileges: string | null;
}) {
  return {
    ...row,
    employeeCodeDisplay: formatEmployeeCode(row.employeeCode),
    privileges: parseShopPrivileges(row.privileges),
    hasLogin: Boolean(row.userId),
  };
}

async function loadMember(id: string, ownerId: string, businessIds: string[], isOwner: boolean) {
  const member = await prisma.staff.findUnique({
    where: { id },
    include: { business: { select: { ownerId: true, id: true } } },
  });
  if (!member || member.business.ownerId !== ownerId) return null;
  if (!isOwner && !businessIds.includes(member.businessId)) return null;
  return member;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireShopAccess('staff', 'EDIT');
    const member = await loadMember(params.id, ctx.ownerId, ctx.businessIds, ctx.isOwner);
    if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body.name === 'string' && body.name.trim().length >= 2) data.name = body.name.trim().slice(0, 80);
    if (typeof body.role === 'string') data.role = body.role.trim().slice(0, 60) || null;
    if (typeof body.phone === 'string') data.phone = body.phone.replace(/\D/g, '').slice(-10) || null;
    if (typeof body.email === 'string') data.email = body.email.trim().slice(0, 120) || null;
    if (typeof body.bio === 'string') data.bio = body.bio.trim().slice(0, 2000) || null;
    if (body.photo === null) data.photo = null;
    else if (typeof body.photo === 'string' && body.photo.startsWith('data:image/')) data.photo = body.photo;
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
    if (body.privileges && typeof body.privileges === 'object') {
      data.privileges = serializeShopPrivileges({
        ...defaultStaffPrivileges(),
        ...body.privileges,
      });
    }

    const updated = await prisma.staff.update({ where: { id: member.id }, data });
    if (member.userId && (data.name || data.email || data.isActive === false)) {
      await prisma.user.update({
        where: { id: member.userId },
        data: {
          ...(typeof data.name === 'string' ? { name: data.name } : {}),
          ...(typeof data.isActive === 'boolean' ? { isActive: data.isActive } : {}),
        },
      });
    }
    return NextResponse.json({ staff: presentStaff(updated) });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireShopAccess('staff', 'EDIT');
    const member = await loadMember(params.id, ctx.ownerId, ctx.businessIds, ctx.isOwner);
    if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.staff.update({
      where: { id: member.id },
      data: { isActive: false, userId: null },
    });
    if (member.userId) {
      const user = await prisma.user.findUnique({
        where: { id: member.userId },
        select: { role: true },
      });
      if (user?.role === 'SHOP_STAFF') {
        await prisma.user.update({
          where: { id: member.userId },
          data: { isActive: false, password: await hashPassword(`disabled-${member.id}`) },
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
