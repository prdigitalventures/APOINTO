export const SHOP_FEATURES = [
  'home',
  'calendar',
  'leads',
  'bookings',
  'services',
  'customers',
  'staff',
  'shops',
  'listing',
  'invoices',
  'alerts',
  'settings',
] as const;

export type ShopFeature = (typeof SHOP_FEATURES)[number];
export type ShopLevel = 'NONE' | 'READ' | 'EDIT';
export type ShopPrivilegeMap = Record<ShopFeature, ShopLevel>;

const RANK: Record<ShopLevel, number> = { NONE: 0, READ: 1, EDIT: 2 };

export const SHOP_FEATURE_LABELS: Record<ShopFeature, string> = {
  home: 'Home',
  calendar: 'Calendar',
  leads: 'Leads',
  bookings: 'Bookings',
  services: 'Services',
  customers: 'Customers',
  staff: 'Staff',
  shops: 'Shops',
  listing: 'Listing',
  invoices: 'Invoices',
  alerts: 'Alerts',
  settings: 'Settings',
};

export function emptyShopPrivileges(): ShopPrivilegeMap {
  return {
    home: 'NONE',
    calendar: 'NONE',
    leads: 'NONE',
    bookings: 'NONE',
    services: 'NONE',
    customers: 'NONE',
    staff: 'NONE',
    shops: 'NONE',
    listing: 'NONE',
    invoices: 'NONE',
    alerts: 'NONE',
    settings: 'NONE',
  };
}

export function ownerShopPrivileges(): ShopPrivilegeMap {
  return {
    home: 'EDIT',
    calendar: 'EDIT',
    leads: 'EDIT',
    bookings: 'EDIT',
    services: 'EDIT',
    customers: 'EDIT',
    staff: 'EDIT',
    shops: 'EDIT',
    listing: 'EDIT',
    invoices: 'EDIT',
    alerts: 'EDIT',
    settings: 'EDIT',
  };
}

/** Shop staff can run the dashboard, but cannot add/delete/edit staff unless the owner grants it. */
export function defaultStaffPrivileges(): ShopPrivilegeMap {
  return {
    home: 'READ',
    calendar: 'EDIT',
    leads: 'EDIT',
    bookings: 'EDIT',
    services: 'EDIT',
    customers: 'EDIT',
    staff: 'NONE',
    shops: 'NONE',
    listing: 'EDIT',
    invoices: 'READ',
    alerts: 'READ',
    settings: 'NONE',
  };
}

export function parseShopPrivileges(raw?: string | null): ShopPrivilegeMap {
  const base = defaultStaffPrivileges();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<Record<ShopFeature, ShopLevel>>;
    for (const feature of SHOP_FEATURES) {
      const level = parsed[feature];
      if (level === 'NONE' || level === 'READ' || level === 'EDIT') base[feature] = level;
    }
  } catch {
    /* keep defaults */
  }
  return base;
}

export function serializeShopPrivileges(map: ShopPrivilegeMap): string {
  return JSON.stringify(map);
}

export function canShop(map: ShopPrivilegeMap, feature: ShopFeature, min: ShopLevel) {
  return RANK[map[feature]] >= RANK[min];
}

export function isShopDashboardRole(role?: string | null) {
  return role === 'OWNER' || role === 'SHOP_STAFF';
}

export function normalizePrivilegePatch(body: unknown): ShopPrivilegeMap {
  const next = defaultStaffPrivileges();
  if (!body || typeof body !== 'object') return next;
  const src = body as Record<string, unknown>;
  for (const feature of SHOP_FEATURES) {
    const level = src[feature];
    if (level === 'NONE' || level === 'READ' || level === 'EDIT') next[feature] = level;
  }
  return next;
}
