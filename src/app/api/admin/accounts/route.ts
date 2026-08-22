import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminError, requirePermission, uniquePlaceholderPhone, writeAudit } from '@/lib/admin';
import { hashPassword } from '@/lib/auth';
import { generateTempPassword } from '@/lib/admin-password';
import { ALREADY_REGISTERED_MESSAGE, normalizeEmail, normalizePhone } from '@/lib/identity';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requirePermission('accounts', 'READ');
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(status === 'disabled' ? { isActive: false } : status === 'active' ? { isActive: true } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        disabledReason: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { businesses: true, bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ users });
  } catch (error) {
    return adminError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const staff = await requirePermission('accounts', 'EDIT');
    const body = await req.json();
    const name = String(body.name || '').trim();
    const email = normalizeEmail(body.email || '');
    const role = body.role === 'OWNER' ? 'OWNER' : 'CUSTOMER';
    if (!name || !email) return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, ...(body.phone ? [{ phone: normalizePhone(body.phone) }] : [])] },
    });
    if (existing) return NextResponse.json({ error: ALREADY_REGISTERED_MESSAGE }, { status: 400 });

    const phone = body.phone ? normalizePhone(body.phone) : await uniquePlaceholderPhone();
    const password = String(body.password || '').trim() || generateTempPassword();
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        role,
        password: await hashPassword(password),
        emailVerifiedAt: new Date(),
      },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
    });

    await writeAudit({
      actorId: staff.session.id,
      action: 'account.create',
      targetType: 'user',
      targetId: user.id,
      metadata: { role, email },
    });

    return NextResponse.json({ user, password, emailed: false });
  } catch (error) {
    return adminError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const staff = await requirePermission('accounts', 'EDIT');
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'User id is required' }, { status: 400 });

    if (typeof body.name === 'string' || typeof body.email === 'string' || typeof body.phone === 'string') {
      const data: { name?: string; email?: string; phone?: string } = {};
      if (typeof body.name === 'string') {
        const name = body.name.trim();
        if (name.length < 2) return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
        data.name = name.slice(0, 80);
      }
      if (typeof body.email === 'string') {
        const email = normalizeEmail(body.email);
        if (!email) return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
        const taken = await prisma.user.findFirst({ where: { email, NOT: { id } } });
        if (taken) return NextResponse.json({ error: 'That email is already in use' }, { status: 400 });
        data.email = email;
      }
      if (typeof body.phone === 'string' && body.phone.trim()) {
        const phone = normalizePhone(body.phone);
        const taken = await prisma.user.findFirst({ where: { phone, NOT: { id } } });
        if (taken) return NextResponse.json({ error: 'That phone is already in use' }, { status: 400 });
        data.phone = phone;
      }
      const user = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, disabledReason: true },
      });
      await writeAudit({
        actorId: staff.session.id,
        action: 'account.edit',
        targetType: 'user',
        targetId: id,
      });
      return NextResponse.json({ user });
    }

    if (id === staff.session.id) {
      return NextResponse.json({ error: 'You cannot disable your own account.' }, { status: 400 });
    }

    const isActive = Boolean(body.isActive);
    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive,
        disabledReason: isActive ? null : String(body.reason || 'Disabled by Apointo admin'),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        disabledReason: true,
      },
    });

    await writeAudit({
      actorId: staff.session.id,
      action: isActive ? 'account.enable' : 'account.disable',
      targetType: 'user',
      targetId: id,
      metadata: { reason: user.disabledReason },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return adminError(error);
  }
}
