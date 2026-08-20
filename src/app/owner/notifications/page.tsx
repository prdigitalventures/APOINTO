'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { ArrowLeft } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  data: Record<string, unknown>;
}

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetch('/api/notifications')
        .then((r) => r.json())
        .then((d) => setNotifications(d.notifications || []));
      fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
    }
  }, [user]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href="/owner"><ArrowLeft size={20} /></Link>
        <h1 className="font-semibold">Notifications</h1>
      </header>
      <div className="divide-y">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No notifications yet</div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`p-4 ${n.status === 'UNREAD' ? 'bg-indigo-50' : 'bg-white'}`}>
              <p className="font-medium text-sm">{n.title}</p>
              <p className="text-sm text-gray-600 mt-1">{n.message}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
