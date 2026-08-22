import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { normalizeEmail, normalizePhone } from '@/lib/identity';
import { requireShopAccess, shopErrorResponse } from '@/lib/shop-access';
import { formatEmployeeCode, randomStaffPassword } from '@/lib/staff-code';
import { whatsappLink } from '@/lib/crm';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireShopAccess('staff', 'EDIT');
    const member = await prisma.staff.findUnique({
      where: { id: params.id },
      include: { business: { select: { ownerId: true, name: true, id: true } } },
    });
    if (!member || member.business.ownerId !== ctx.ownerId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (!ctx.isOwner && !ctx.businessIds.includes(member.businessId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const phone = member.phone ? normalizePhone(member.phone) : '';
    if (phone.length !== 10) {
      return NextResponse.json(
        { error: 'Save a 10-digit mobile number on this staff profile first.' },
        { status: 400 }
      );
    }

    const emailRaw =
      member.email && member.email.includes('@')
        ? member.email
        : `staff.${(member.employeeCode || member.id).toLowerCase()}@staff.apointo.online`;
    const email = normalizeEmail(emailRaw);
    const password = randomStaffPassword();
    const hashed = await hashPassword(password);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ phone }, { email }] },
    });

    let userId = member.userId;
    if (existing) {
      if (existing.role === 'ADMIN' || existing.role === 'STAFF' || existing.role === 'OWNER') {
        return NextResponse.json(
          { error: 'That phone or email already belongs to another Apointo account.' },
          { status: 409 }
        );
      }
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: member.name,
          password: hashed,
          role: 'SHOP_STAFF',
          isActive: true,
          emailVerifiedAt: existing.emailVerifiedAt || new Date(),
        },
      });
      userId = existing.id;
    } else {
      const created = await prisma.user.create({
        data: {
          name: member.name,
          phone,
          email,
          password: hashed,
          role: 'SHOP_STAFF',
          emailVerifiedAt: new Date(),
        },
      });
      userId = created.id;
    }

    await prisma.staff.update({ where: { id: member.id }, data: { userId, phone, email } });

    const loginUrl = 'https://www.apointo.online/login?role=owner';
    const share = `Hi ${member.name}, your ${member.business.name} Apointo login is ready. ID: ${formatEmployeeCode(member.employeeCode)}. Phone: ${phone}. Temporary password: ${password}. Open ${loginUrl}`;

    return NextResponse.json({
      login: {
        phone,
        email,
        password,
        loginUrl,
        employeeCode: formatEmployeeCode(member.employeeCode),
        whatsapp: member.phone ? whatsappLink(member.phone, share) : null,
      },
    });
  } catch (error) {
    const { error: message, status } = shopErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
