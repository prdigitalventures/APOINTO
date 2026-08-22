import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireSession, toSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { resolvePermissions } from '@/lib/admin';
import { appOrigin, makeReferralCode } from '@/lib/referral';
import { loadShopContext } from '@/lib/shop-access';
import { ownerShopPrivileges, defaultStaffPrivileges } from '@/lib/shop-privileges';

export const dynamic = 'force-dynamic';

const userSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  role: true,
  emailVerifiedAt: true,
  googleId: true,
  avatar: true,
  rewardPoints: true,
  referralCode: true,
} as const;

function present(user: {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  emailVerifiedAt: Date | null;
  googleId: string | null;
  avatar: string | null;
  rewardPoints: number;
  referralCode: string | null;
}) {
  const sessionUser = toSessionUser(user);
  const referralCode = user.referralCode || makeReferralCode(user.id);
  return {
    ...sessionUser,
    emailVerified: Boolean(user.emailVerifiedAt || user.googleId),
    avatar: user.avatar,
    rewardPoints: user.rewardPoints,
    referralCode,
    referralLink: `${appOrigin()}/register?ref=${referralCode}${user.role === 'OWNER' ? '&role=owner' : ''}`,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  let user = await prisma.user.findUnique({
    where: { id: session.id },
    select: userSelect,
  });
  if (!user) return NextResponse.json({ user: null });

  if (!user.referralCode) {
    try {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { referralCode: makeReferralCode(user.id) },
        select: userSelect,
      });
    } catch {
      /* unique race is fine; code still derived */
    }
  }

  let isStaff = false;
  try {
    const staff = await resolvePermissions(user.id);
    isStaff = staff.isStaff;
  } catch {
    isStaff = session.role === 'ADMIN' || session.role === 'STAFF';
  }

  let shopPrivileges = ownerShopPrivileges();
  let isOwner = user.role === 'OWNER';
  if (user.role === 'SHOP_STAFF' || user.role === 'OWNER') {
    try {
      const shop = await loadShopContext();
      shopPrivileges = shop.privileges;
      isOwner = shop.isOwner;
    } catch {
      if (user.role === 'SHOP_STAFF') shopPrivileges = defaultStaffPrivileges();
    }
  }

  return NextResponse.json({
    user: { ...present(user), isStaff, shopPrivileges, isOwner },
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const data: { name?: string; avatar?: string | null; rewardPoints?: number } = {};

    if (typeof body.name === 'string') {
      const name = body.name.trim();
      if (name.length < 2) {
        return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 });
      }
      data.name = name.slice(0, 80);
    }

    const existing = await prisma.user.findUnique({
      where: { id: session.id },
      select: { avatar: true, rewardPoints: true },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (body.avatar === null) {
      data.avatar = null;
    } else if (typeof body.avatar === 'string') {
      if (body.avatar.length > 350_000) {
        return NextResponse.json({ error: 'Photo is too large. Try a smaller image.' }, { status: 400 });
      }
      if (body.avatar && !body.avatar.startsWith('data:image/')) {
        return NextResponse.json({ error: 'Upload a photo file.' }, { status: 400 });
      }
      data.avatar = body.avatar;
      if (!existing.avatar && body.avatar) {
        data.rewardPoints = existing.rewardPoints + 25;
      }
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data,
      select: userSelect,
    });

    return NextResponse.json({ user: present(user) });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
