'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Shield,
  Users,
  BookOpen,
  Contact,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { can, FEATURE_LABELS, type AdminFeature, type PermissionMap } from '@/lib/admin-permissions';
import { cn } from '@/lib/utils';
import { EmailNoticeProvider } from '@/components/admin/EmailNotice';

const NAV: Array<{ href: string; feature: AdminFeature; icon: typeof LayoutDashboard }> = [
  { href: '/admin', feature: 'dashboard', icon: LayoutDashboard },
  { href: '/admin/crm', feature: 'crm', icon: Contact },
  { href: '/admin/businesses', feature: 'businesses', icon: Building2 },
  { href: '/admin/accounts', feature: 'accounts', icon: Users },
  { href: '/admin/campaigns', feature: 'campaigns', icon: Mail },
  { href: '/admin/team', feature: 'team', icon: Shield },
  { href: '/admin/help', feature: 'tutorials', icon: BookOpen },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [perms, setPerms] = useState<PermissionMap | null>(null);
  const [meta, setMeta] = useState<{ roleName: string | null; department: string | null } | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login?next=/admin');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/admin/me')
      .then(async (r) => {
        if (r.status === 401) {
          router.push('/login?next=/admin');
          return;
        }
        if (!r.ok) {
          setForbidden(true);
          return;
        }
        const data = await r.json();
        setPerms(data.permissions);
        setMeta({ roleName: data.roleName, department: data.department });
      })
      .catch(() => setForbidden(true));
  }, [user, router]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (forbidden) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-xl font-bold">Admin access only</h1>
          <p className="mt-2 text-sm text-gray-600">This dashboard is for Apointo team members.</p>
          <Link href="/" className="mt-4 inline-block text-indigo-600 font-medium">Go home</Link>
        </div>
      </div>
    );
  }

  if (!perms) {
    return <div className="min-h-screen flex items-center justify-center">Loading admin...</div>;
  }

  const items = NAV.filter((item) => can(perms, item.feature, 'READ'));

  const nav = (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMenuOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
              active
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
            )}
          >
            <Icon className="h-4 w-4" />
            {FEATURE_LABELS[item.feature]}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <EmailNoticeProvider>
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0d12]">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r bg-white p-4 dark:bg-[#16181d] dark:border-gray-800">
        <div className="mb-6 px-2">
          <p className="text-lg font-bold">Apointo admin</p>
          <p className="text-xs text-gray-500">{meta?.roleName || 'Staff'}{meta?.department ? ` · ${meta.department}` : ''}</p>
        </div>
        {nav}
        <button
          className="mt-auto flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          onClick={async () => {
            await logout();
            router.push('/login');
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden dark:bg-[#16181d] dark:border-gray-800">
          <p className="font-semibold">Apointo admin</p>
          <button onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        </header>
        {menuOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-white p-4 dark:bg-[#16181d]">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-bold">Menu</p>
                <button onClick={() => setMenuOpen(false)}><X className="h-5 w-5" /></button>
              </div>
              {nav}
            </div>
          </div>
        ) : null}
        <main className="mx-auto max-w-6xl p-4 pb-24 lg:p-8">{children}</main>
      </div>
    </div>
    </EmailNoticeProvider>
  );
}
