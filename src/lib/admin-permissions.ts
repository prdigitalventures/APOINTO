export const ADMIN_FEATURES = [
  'dashboard',
  'crm',
  'businesses',
  'accounts',
  'campaigns',
  'team',
  'tutorials',
] as const;

export type AdminFeature = (typeof ADMIN_FEATURES)[number];
export type PermissionLevel = 'NONE' | 'READ' | 'EDIT';
export type StaffDepartment = 'SALES' | 'MEDIA' | 'SUPPORT' | 'OPS' | 'ADMIN';

export const FEATURE_LABELS: Record<AdminFeature, string> = {
  dashboard: 'Home',
  crm: 'CRM',
  businesses: 'Businesses',
  accounts: 'Accounts',
  campaigns: 'Campaigns',
  team: 'Team',
  tutorials: 'How to use',
};

export const DEPARTMENT_LABELS: Record<StaffDepartment, string> = {
  SALES: 'Sales',
  MEDIA: 'Media',
  SUPPORT: 'Support',
  OPS: 'Operations',
  ADMIN: 'Admin',
};

export type PermissionMap = Record<AdminFeature, PermissionLevel>;

export const LEVEL_RANK: Record<PermissionLevel, number> = {
  NONE: 0,
  READ: 1,
  EDIT: 2,
};

export function emptyPermissions(): PermissionMap {
  return {
    dashboard: 'NONE',
    crm: 'NONE',
    businesses: 'NONE',
    accounts: 'NONE',
    campaigns: 'NONE',
    team: 'NONE',
    tutorials: 'NONE',
  };
}

export function allEditPermissions(): PermissionMap {
  return {
    dashboard: 'EDIT',
    crm: 'EDIT',
    businesses: 'EDIT',
    accounts: 'EDIT',
    campaigns: 'EDIT',
    team: 'EDIT',
    tutorials: 'EDIT',
  };
}

export function can(map: PermissionMap, feature: AdminFeature, min: PermissionLevel) {
  return LEVEL_RANK[map[feature]] >= LEVEL_RANK[min];
}

export const DEFAULT_ROLE_PACKS: Array<{
  name: string;
  description: string;
  department?: StaffDepartment;
  permissions: PermissionMap;
}> = [
  {
    name: 'Super admin',
    description: 'Full access to the Apointo ops dashboard',
    department: 'ADMIN',
    permissions: allEditPermissions(),
  },
  {
    name: 'Sales',
    description: 'Owners, CRM, businesses, and campaigns',
    department: 'SALES',
    permissions: {
      dashboard: 'READ',
      crm: 'EDIT',
      businesses: 'EDIT',
      accounts: 'READ',
      campaigns: 'EDIT',
      team: 'NONE',
      tutorials: 'READ',
    },
  },
  {
    name: 'Media',
    description: 'Campaigns and listing copy',
    department: 'MEDIA',
    permissions: {
      dashboard: 'READ',
      crm: 'READ',
      businesses: 'READ',
      accounts: 'NONE',
      campaigns: 'EDIT',
      team: 'NONE',
      tutorials: 'READ',
    },
  },
  {
    name: 'Support',
    description: 'Accounts, password resets, and CRM notes',
    department: 'SUPPORT',
    permissions: {
      dashboard: 'READ',
      crm: 'EDIT',
      businesses: 'READ',
      accounts: 'EDIT',
      campaigns: 'NONE',
      team: 'NONE',
      tutorials: 'READ',
    },
  },
];

export function isStaffAppRole(role: string) {
  return role === 'ADMIN' || role === 'STAFF';
}
