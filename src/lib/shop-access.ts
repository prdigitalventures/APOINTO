import { prisma } from './db';
import { getSession, requireSession, type SessionUser } from './auth';
import {
  canShop,
  ownerShopPrivileges,
  parseShopPrivileges,
  type ShopFeature,
  type ShopLevel,
  type ShopPrivilegeMap,
} from './shop-privileges';

export class ShopAccessError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

export type ShopContext = {
  session: SessionUser;
  ownerId: string;
  isOwner: boolean;
  privileges: ShopPrivilegeMap;
  businessIds: string[];
  staffId: string | null;
};

export async function loadShopContext(): Promise<ShopContext> {
  const session = await requireSession();
  if (session.role === 'OWNER') {
    const shops = await prisma.business.findMany({
      where: { ownerId: session.id },
      select: { id: true },
    });
    return {
      session,
      ownerId: session.id,
      isOwner: true,
      privileges: ownerShopPrivileges(),
      businessIds: shops.map((s) => s.id),
      staffId: null,
    };
  }

  if (session.role === 'SHOP_STAFF') {
    const seats = await prisma.staff.findMany({
      where: { userId: session.id, isActive: true },
      select: {
        id: true,
        privileges: true,
        business: { select: { id: true, ownerId: true, isActive: true } },
      },
    });
    const live = seats.filter((s) => s.business);
    if (!live.length) throw new ShopAccessError('This staff login is no longer active.', 403);
    const ownerId = live[0].business.ownerId;
    const merged = parseShopPrivileges(live[0].privileges);
    return {
      session,
      ownerId,
      isOwner: false,
      privileges: merged,
      businessIds: live.map((s) => s.business.id),
      staffId: live[0].id,
    };
  }

  throw new ShopAccessError('Forbidden', 403);
}

export async function requireShopAccess(feature: ShopFeature, min: ShopLevel = 'READ'): Promise<ShopContext> {
  const ctx = await loadShopContext();
  if (!canShop(ctx.privileges, feature, min)) {
    throw new ShopAccessError('You do not have permission for this.', 403);
  }
  return ctx;
}

export async function assertBusinessInScope(ctx: ShopContext, businessId: string) {
  if (ctx.isOwner) {
    const shop = await prisma.business.findFirst({
      where: { id: businessId, ownerId: ctx.ownerId },
      select: { id: true },
    });
    if (!shop) throw new ShopAccessError('Business not found', 404);
    return;
  }
  if (!ctx.businessIds.includes(businessId)) throw new ShopAccessError('Business not found', 404);
}

export function shopErrorResponse(error: unknown) {
  if (error instanceof ShopAccessError) {
    return { error: error.message, status: error.status };
  }
  const message = (error as Error).message;
  if (message === 'Unauthorized') return { error: message, status: 401 };
  if (message === 'Forbidden') return { error: message, status: 403 };
  return { error: message || 'Request failed', status: 400 };
}

export async function optionalShopSession() {
  const session = await getSession();
  if (!session) return null;
  try {
    return await loadShopContext();
  } catch {
    return null;
  }
}
