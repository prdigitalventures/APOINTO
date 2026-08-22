import { NextResponse } from 'next/server';
import { prisma } from './db';
import { getSession, type SessionUser } from './auth';
import { normalizeEmail } from './identity';
import {
  ADMIN_FEATURES,
  DEFAULT_ROLE_PACKS,
  allEditPermissions,
  can,
  emptyPermissions,
  isStaffAppRole,
  type AdminFeature,
  type PermissionLevel,
  type PermissionMap,
} from './admin-permissions';

export { can, ADMIN_FEATURES };
export type { AdminFeature, PermissionLevel, PermissionMap };

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => normalizeEmail(s))
    .filter(Boolean);
}

export function isBootstrapAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return adminEmails().includes(normalizeEmail(email));
}

export async function ensureDefaultRoles() {
  for (const pack of DEFAULT_ROLE_PACKS) {
    const existing = await prisma.role.findUnique({ where: { name: pack.name } });
    if (existing) {
      for (const feature of ADMIN_FEATURES) {
        await prisma.rolePermission.upsert({
          where: { roleId_feature: { roleId: existing.id, feature } },
          create: { roleId: existing.id, feature, level: pack.permissions[feature] },
          update: { level: pack.permissions[feature] },
        });
      }
      continue;
    }
    await prisma.role.create({
      data: {
        name: pack.name,
        description: pack.description,
        isSystem: true,
        permissions: {
          create: ADMIN_FEATURES.map((feature) => ({
            feature,
            level: pack.permissions[feature],
          })),
        },
      },
    });
  }
}

export async function bootstrapStaffUser(user: {
  id: string;
  email: string | null;
  role: string;
  isActive?: boolean;
}) {
  await ensureDefaultRoles();
  if (!isBootstrapAdminEmail(user.email)) return;

  const superRole = await prisma.role.findUnique({ where: { name: 'Super admin' } });
  const nextRole = user.role === 'OWNER' || isStaffAppRole(user.role) ? user.role : 'ADMIN';

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: nextRole,
      staffRoleId: superRole?.id,
    },
  });

  await prisma.staffProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, department: 'ADMIN', isActive: true },
    update: { isActive: true, department: 'ADMIN' },
  });
}

export async function resolvePermissions(userId: string): Promise<{
  isStaff: boolean;
  isSuperAdmin: boolean;
  permissions: PermissionMap;
  department: string | null;
  roleName: string | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      staffProfile: true,
      staffRole: { include: { permissions: true } },
      permissionOverrides: true,
    },
  });

  if (!user || user.isActive === false) {
    return { isStaff: false, isSuperAdmin: false, permissions: emptyPermissions(), department: null, roleName: null };
  }

  if (user.email) await bootstrapStaffUser(user);

  const refreshed =
    user.staffProfile && user.staffRole
      ? user
      : await prisma.user.findUnique({
          where: { id: userId },
          include: {
            staffProfile: true,
            staffRole: { include: { permissions: true } },
            permissionOverrides: true,
          },
        });

  if (!refreshed) {
    return { isStaff: false, isSuperAdmin: false, permissions: emptyPermissions(), department: null, roleName: null };
  }

  const superByEmail = isBootstrapAdminEmail(refreshed.email);
  const profileActive = refreshed.staffProfile?.isActive !== false && Boolean(refreshed.staffProfile);
  const isStaff = superByEmail || profileActive || isStaffAppRole(refreshed.role);
  const isSuperAdmin =
    superByEmail ||
    refreshed.role === 'ADMIN' ||
    refreshed.staffRole?.name === 'Super admin';

  if (!isStaff) {
    return { isStaff: false, isSuperAdmin: false, permissions: emptyPermissions(), department: null, roleName: null };
  }

  const map = emptyPermissions();
  if (isSuperAdmin) {
    Object.assign(map, allEditPermissions());
  } else if (refreshed.staffRole) {
    for (const row of refreshed.staffRole.permissions) {
      if ((ADMIN_FEATURES as readonly string[]).includes(row.feature)) {
        map[row.feature as AdminFeature] = row.level as PermissionLevel;
      }
    }
  }
  for (const row of refreshed.permissionOverrides) {
    if ((ADMIN_FEATURES as readonly string[]).includes(row.feature)) {
      map[row.feature as AdminFeature] = row.level as PermissionLevel;
    }
  }

  return {
    isStaff,
    isSuperAdmin,
    permissions: map,
    department: refreshed.staffProfile?.department || null,
    roleName: refreshed.staffRole?.name || (isSuperAdmin ? 'Super admin' : null),
  };
}

export async function requireStaff(): Promise<{
  session: SessionUser;
  permissions: PermissionMap;
  isSuperAdmin: boolean;
  department: string | null;
  roleName: string | null;
}> {
  const session = await getSession();
  if (!session) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
  const live = await prisma.user.findUnique({
    where: { id: session.id },
    select: { isActive: true, email: true, role: true },
  });
  if (!live || live.isActive === false) {
    throw Object.assign(new Error('This account has been disabled.'), { status: 403 });
  }
  await bootstrapStaffUser({ id: session.id, email: live.email, role: live.role });
  const resolved = await resolvePermissions(session.id);
  if (!resolved.isStaff) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  return {
    session,
    permissions: resolved.permissions,
    isSuperAdmin: resolved.isSuperAdmin,
    department: resolved.department,
    roleName: resolved.roleName,
  };
}

export async function requirePermission(feature: AdminFeature, min: PermissionLevel) {
  const staff = await requireStaff();
  if (!can(staff.permissions, feature, min)) {
    throw Object.assign(new Error('You do not have access to this area.'), { status: 403 });
  }
  return staff;
}

export function adminError(error: unknown) {
  const status = (error as { status?: number }).status || 400;
  const message = (error as Error).message || 'Request failed';
  if (message === 'Unauthorized') return NextResponse.json({ error: message }, { status: 401 });
  return NextResponse.json({ error: message }, { status });
}

export async function writeAudit(input: {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.adminAudit.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId || null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}

export async function uniquePlaceholderPhone() {
  for (let i = 0; i < 30; i++) {
    const phone = `70${Math.floor(Math.random() * 1e8)
      .toString()
      .padStart(8, '0')}`;
    const exists = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
    if (!exists) return phone;
  }
  throw new Error('Could not allocate a placeholder phone number');
}
