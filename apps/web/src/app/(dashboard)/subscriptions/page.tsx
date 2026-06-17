'use client';

import { DataTable } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, TrendingUp } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { format, addMonths } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { RevenueChart } from '@/components/charts/revenue-chart';

interface Subscription {
  id: string;
  user: string;
  email: string;
  plan: 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled';
  mrr: number;
  startDate: Date;
  nextBilling: Date;
}

const MOCK_SUBS: Subscription[] = Array.from({ length: 40 }, (_, i) => ({
  id: `sub_${i + 1}`,
  user: ['Alice Martin', 'Bob Chen', 'Carol Davis', 'David Kim', 'Emma Wilson'][i % 5],
  email: `user${i + 1}@example.com`,
  plan: i % 5 === 0 ? 'enterprise' : 'pro',
  status: i % 12 === 0 ? 'past_due' : i % 20 === 0 ? 'canceled' : 'active',
  mrr: i % 5 === 0 ? 199 : 29,
  startDate: new Date(Date.now() - Math.random() * 3e10),
  nextBilling: addMonths(new Date(), 1),
}));

const planColors: Record<string, 'default' | 'info'> = {
  enterprise: 'default',
  pro: 'info',
};

const statusColors: Record<string, 'success' | 'warning' | 'secondary'> = {
  active: 'success',
  past_due: 'warning',
  canceled: 'secondary',
};

const columns: ColumnDef<Subscription>[] = [
  {
    accessorKey: 'user',
    header: 'Customer',
    cell: ({ row }) => (
      <div>
        <p className="text-[13px] font-medium">{row.original.user}</p>
        <p className="text-[12px] text-muted-foreground">{row.original.email}</p>
      </div>
    ),
  },
  {
    accessorKey: 'plan',
    header: 'Plan',
    cell: ({ row }) => (
      <Badge variant={planColors[row.original.plan]} className="capitalize">{row.original.plan}</Badge>
    ),
    size: 100,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={statusColors[row.original.status]} className="capitalize">
        {row.original.status.replace('_', ' ')}
      </Badge>
    ),
    size: 100,
  },
  {
    accessorKey: 'mrr',
    header: 'MRR',
    cell: ({ row }) => (
      <span className="text-[13px] font-medium tabular-nums">{formatCurrency(row.original.mrr)}/mo</span>
    ),
    size: 100,
  },
  {
    accessorKey: 'nextBilling',
    header: 'Next Billing',
    cell: ({ row }) => (
      <span className="text-[13px] text-muted-foreground">{format(row.original.nextBilling, 'MMM d, yyyy')}</span>
    ),
  },
  {
    id: 'actions',
    size: 48,
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View invoice</DropdownMenuItem>
          <DropdownMenuItem>Change plan</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive>Cancel subscription</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export default function SubscriptionsPage() {
  const activeSubs = MOCK_SUBS.filter((s) => s.status === 'active');
  const mrr = activeSubs.reduce((sum, s) => sum + s.mrr, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Subscription management and revenue analytics</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'MRR', value: formatCurrency(mrr), delta: '+22.1%' },
          { label: 'ARR', value: formatCurrency(mrr * 12), delta: 'Annualized' },
          { label: 'Active Subs', value: String(activeSubs.length), delta: `of ${MOCK_SUBS.length} total` },
          { label: 'Avg Revenue / Sub', value: formatCurrency(mrr / activeSubs.length), delta: 'Per customer' },
        ].map(({ label, value, delta }) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-[13px] text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">{delta}</p>
          </div>
        ))}
      </div>

      <RevenueChart />

      <DataTable
        data={MOCK_SUBS}
        columns={columns}
        searchKey="user"
        searchPlaceholder="Search customers…"
      />
    </div>
  );
}
