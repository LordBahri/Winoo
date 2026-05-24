'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  PawPrint,
  Tag,
  AlertTriangle,
  Activity,
  BarChart2,
  CreditCard,
  Settings,
  ShieldCheck,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/pets', label: 'Pets', icon: PawPrint },
  { href: '/tags', label: 'NFC Tags', icon: Tag },
  { href: '/lost-pets', label: 'Lost Pets', icon: AlertTriangle },
  { href: '/scan-events', label: 'Scan Events', icon: Activity },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/subscriptions', label: 'Billing', icon: CreditCard },
  { href: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-xl font-bold">PetID</span>
        <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
          Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors hover:bg-accent ${
                isActive ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
