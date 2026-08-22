import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { allocateEmployeeCode, formatEmployeeCode } from '@/lib/staff-code';
import { assertBusinessInScope, requireShopAccess, shopErrorResponse } from '@/lib/shop-access';
import { defaultStaffPrivileges, parseShopPrivileges, serializeShopPrivileges } from '@/lib/shop-privileges';

export const dynamic = 'force-dynamic';

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

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireShopAccess('staff', 'READ');
    const businessId = req.nextUrl.searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    await assertBusinessInScope(ctx, businessId);
    const staff = await prisma.staff.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({
      staff: staff.map(presentStaff),
      canManage: ctx.isOwner || ctx.privileges.staff === 'EDIT',
    });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireShopAccess('staff', 'EDIT');
    const body = await req.json();
    const businessId = typeof body.businessId === 'string' ? body.businessId : '';
    if (!businessId) return NextResponse.json({ error: 'Select a shop.' }, { status: 400 });
    await assertBusinessInScope(ctx, businessId);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length < 2) return NextResponse.json({ error: 'Enter the staff name.' }, { status: 400 });

    const employeeCode = await allocateEmployeeCode();
    const privileges = body.privileges
      ? serializeShopPrivileges({ ...defaultStaffPrivileges(), ...body.privileges })
      : serializeShopPrivileges(defaultStaffPrivileges());

    const member = await prisma.staff.create({
      data: {
        businessId,
        name: name.slice(0, 80),
        role: typeof body.role === 'string' ? body.role.trim().slice(0, 60) || null : 'Team member',
        phone: typeof body.phone === 'string' ? body.phone.replace(/\D/g, '').slice(-10) || null : null,
        email: typeof body.email === 'string' ? body.email.trim().slice(0, 120) || null : null,
        bio: typeof body.bio === 'string' ? body.bio.trim().slice(0, 2000) || null : null,
        photo: typeof body.photo === 'string' && body.photo.startsWith('data:image/') ? body.photo : null,
        employeeCode,
        privileges,
        isActive: true,
      },
    });
    return NextResponse.json({ staff: presentStaff(member) });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
