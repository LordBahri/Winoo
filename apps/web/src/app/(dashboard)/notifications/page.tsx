'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, PawPrint, Tag, Users, CheckCircle2, Bell, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'lost_pet' | 'new_user' | 'tag_deactivated' | 'system' | 'subscription';
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}

const MOCK_NOTIFS: Notification[] = [
  { id: 'n1', type: 'lost_pet', title: 'Lost pet alert', body: 'Max (Golden Retriever) was reported lost in Paris, France by Alice Martin.', read: false, createdAt: new Date(Date.now() - 3.6e5) },
  { id: 'n2', type: 'lost_pet', title: 'Lost pet alert', body: 'Luna (Persian cat) reported lost in London, UK.', read: false, createdAt: new Date(Date.now() - 7.2e5) },
  { id: 'n3', type: 'subscription', title: 'New enterprise subscription', body: 'Tech Corp signed up for an Enterprise plan at $199/mo.', read: false, createdAt: new Date(Date.now() - 1.08e6) },
  { id: 'n4', type: 'new_user', title: '1,000 new users milestone', body: 'PetID reached 12,840 registered users this month.', read: false, createdAt: new Date(Date.now() - 3.6e6) },
  { id: 'n5', type: 'tag_deactivated', title: 'Tag bulk deactivation', body: 'Batch BATCH-2024-03 had 42 tags reported as damaged and deactivated.', read: false, createdAt: new Date(Date.now() - 8.64e6) },
  { id: 'n6', type: 'system', title: 'API latency spike', body: 'The scan-events endpoint experienced 2.1s avg latency for 8 minutes. Now resolved.', read: true, createdAt: new Date(Date.now() - 8.64e7) },
  { id: 'n7', type: 'lost_pet', title: 'Lost pet found', body: 'Charlie (Beagle) was reunited with owner David Kim after 3 days.', read: true, createdAt: new Date(Date.now() - 1.728e8) },
  { id: 'n8', type: 'new_user', title: 'New admin account', body: 'Bob Chen has been granted ADMIN role by Super Admin.', read: true, createdAt: new Date(Date.now() - 2.592e8) },
];

const typeConfig = {
  lost_pet: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  new_user: { icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  tag_deactivated: { icon: Tag, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  system: { icon: Bell, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  subscription: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const unread = notifs.filter((n) => !n.read).length;

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {unread > 0 ? `${unread} unread notifications` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="rounded-xl border bg-card shadow-sm divide-y overflow-hidden">
        {notifs.map((notif) => {
          const { icon: Icon, color, bg } = typeConfig[notif.type];
          return (
            <div
              key={notif.id}
              className={cn(
                'flex items-start gap-4 px-5 py-4 transition-colors',
                !notif.read && 'bg-primary/[0.03]',
              )}
            >
              <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', bg)}>
                <Icon className={cn('h-4 w-4', color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn('text-[13px] font-medium', !notif.read && 'font-semibold')}>{notif.title}</p>
                  {!notif.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </div>
                <p className="mt-0.5 text-[13px] text-muted-foreground leading-relaxed">{notif.body}</p>
                <p className="mt-1.5 text-[11px] text-muted-foreground/60">
                  {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
                </p>
              </div>
              {!notif.read && (
                <button
                  onClick={() => markRead(notif.id)}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
