'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface Notification {
  id: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="border-b bg-white px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <Bell size={19} />
          </div>
          <div>
            <h1 className="font-semibold">Alerts</h1>
            <p className="text-xs text-gray-500">Booking updates and reminders</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg divide-y">
        {notifications.length === 0 ? (
          <div className="px-4 py-16 text-center text-gray-500">
            <Bell className="mx-auto mb-3 text-indigo-200" size={32} />
            <p>No alerts yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <article
              key={notification.id}
              className={`p-4 ${notification.status === 'UNREAD' ? 'bg-indigo-50' : 'bg-white'}`}
            >
              <p className="text-sm font-medium">{notification.title}</p>
              <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
              <p className="mt-2 text-xs text-gray-400">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </article>
          ))
        )}
      </main>
    </div>
  );
}
