import { NextResponse } from 'next/server';
import { adminError, requireStaff } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const staff = await requireStaff();
    return NextResponse.json({
      user: {
        id: staff.session.id,
        name: staff.session.name,
        email: staff.session.email,
        role: staff.session.role,
      },
      isSuperAdmin: staff.isSuperAdmin,
      department: staff.department,
      roleName: staff.roleName,
      permissions: staff.permissions,
    });
  } catch (error) {
    return adminError(error);
  }
}
