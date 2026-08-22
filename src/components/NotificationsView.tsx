'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { cn } from '@/lib/utils';
import { resolveAlertVisual } from '@/lib/alert-styles';

interface Notification {
  id: string;
  type?: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
}

function formatAlertTime(iso: string) {
  const date = new Date(iso);
  const now = Date.now();
  const diffMin = Math.round((now - date.getTime()) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function NotificationsView({
  expectedRole,
}: {
  expectedRole: 'OWNER' | 'CUSTOMER';
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== expectedRole) {
      router.push(user.role === 'OWNER' ? '/owner' : '/customer');
    }
  }, [expectedRole, loading, router, user]);

  useEffect(() => {
    if (!user || user.role !== expectedRole) return;

    fetch('/api/notifications')
      .then((response) => response.json())
      .then((data) => setNotifications(data.notifications || []))
      .finally(() => setLoaded(true));

    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
  }, [expectedRole, user]);

  if (loading || !user || !loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 dark:bg-[#0b0d12]">
      <header className="border-b border-gray-100 bg-white/90 px-4 py-4 backdrop-blur dark:border-gray-800 dark:bg-[#16181d]/90">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
            <Bell size={19} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Alerts</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Color-coded booking updates at a glance
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-3 px-4 py-4">
        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-4 py-16 text-center dark:border-gray-700 dark:bg-[#16181d]">
            <Bell className="mx-auto mb-3 text-indigo-300 dark:text-indigo-500" size={32} />
            <p className="font-medium text-gray-700 dark:text-gray-200">No alerts yet</p>
            <p className="mt-1 text-sm text-gray-500">Booking updates will show up here.</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const visual = resolveAlertVisual(
              notification.type,
              notification.title,
              notification.message
            );
            const Icon = visual.icon;
            const unread = notification.status === 'UNREAD';

            return (
              <article
                key={notification.id}
                className={cn(
                  'relative overflow-hidden rounded-2xl border shadow-sm transition-colors',
                  unread ? visual.unreadCard : visual.readCard
                )}
              >
                <span className={cn('absolute inset-y-0 left-0 w-1.5', visual.bar)} />
                <div className="flex gap-3 p-4 pl-5">
                  <div
                    className={cn(
                      'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm',
                      visual.iconWrap,
                      unread ? 'ring-2 ring-white/70 dark:ring-white/10' : 'opacity-90'
                    )}
                  >
                    <Icon size={20} strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-semibold leading-snug', visual.title)}>
                        {notification.title.replace(/^[^\p{L}\p{N}]+/u, '').trim() || notification.title}
                      </p>
                      {unread ? (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-current opacity-80" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                      {notification.message}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                          visual.badge
                        )}
                      >
                        {visual.label}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatAlertTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </main>
    </div>
  );
}
