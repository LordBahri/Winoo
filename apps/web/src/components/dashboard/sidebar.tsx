'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, PawPrint, Tag, AlertTriangle,
  Activity, BarChart2, CreditCard, Settings, ShieldCheck,
  Bell, FileText, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sections = [
  {
    label: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/users', label: 'Users', icon: Users, count: '1.2k' },
      { href: '/pets', label: 'Pets', icon: PawPrint, count: '8.4k' },
      { href: '/tags', label: 'NFC Tags', icon: Tag, count: '12.1k' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/lost-pets', label: 'Lost Pets', icon: AlertTriangle, alert: 3 },
      { href: '/scan-events', label: 'Scan Events', icon: Activity },
      { href: '/analytics', label: 'Analytics', icon: BarChart2 },
      { href: '/reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/subscriptions', label: 'Billing', icon: CreditCard },
      { href: '/notifications', label: 'Notifications', icon: Bell, alert: 5 },
      { href: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r bg-[hsl(var(--sidebar))] border-[hsl(var(--sidebar-border))]">
      <div className="flex h-14 items-center gap-2.5 border-b border-[hsl(var(--sidebar-border))] px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">PetID</span>
        <span className="ml-auto rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {sections.map(({ label, items }) => (
          <div key={label} className="mb-1">
            <p className="mb-1 px-4 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
              {label}
            </p>
            {items.map(({ href, label: itemLabel, icon: Icon, count, alert }) => {
              const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'group relative mx-2 flex items-center gap-2.5 rounded-md px-3 py-[7px] text-[13px] transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{itemLabel}</span>
                  {alert != null && (
                    <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive/90 px-1 text-[10px] font-semibold text-white">
                      {alert}
                    </span>
                  )}
                  {count && !alert && (
                    <span className="ml-auto text-[11px] tabular-nums text-muted-foreground/50">{count}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-[hsl(var(--sidebar-border))] p-3">
        <div className="rounded-lg bg-primary/8 p-3">
          <p className="text-[11px] font-semibold text-primary">Pro Plan · Active</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Unlimited tags &amp; scans</p>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full w-3/4 rounded-full bg-primary/70" />
          </div>
        </div>
      </div>
    </aside>
  );
}
