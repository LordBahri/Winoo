'use client';

import { DataTable } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  createdAt: Date;
}

const ACTIONS = [
  { action: 'user.create', resource: 'User', severity: 'low' },
  { action: 'user.suspend', resource: 'User', severity: 'high' },
  { action: 'pet.create', resource: 'Pet', severity: 'low' },
  { action: 'pet.delete', resource: 'Pet', severity: 'medium' },
  { action: 'tag.deactivate', resource: 'NfcTag', severity: 'high' },
  { action: 'subscription.cancel', resource: 'Subscription', severity: 'medium' },
  { action: 'admin.login', resource: 'Auth', severity: 'medium' },
  { action: 'settings.update', resource: 'Settings', severity: 'high' },
  { action: 'report.export', resource: 'Report', severity: 'low' },
  { action: 'role.change', resource: 'User', severity: 'critical' },
] as const;

const MOCK_LOGS: AuditLog[] = Array.from({ length: 80 }, (_, i) => {
  const a = ACTIONS[i % ACTIONS.length];
  return {
    id: `log_${i + 1}`,
    actor: ['Alice Martin', 'Bob Chen (Admin)', 'System'][i % 3],
    actorRole: i % 3 === 2 ? 'SYSTEM' : i % 3 === 1 ? 'ADMIN' : 'SUPER_ADMIN',
    action: a.action,
    resource: a.resource,
    resourceId: `${a.resource.toLowerCase()}_${Math.floor(Math.random() * 9999)}`,
    severity: a.severity as AuditLog['severity'],
    ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    createdAt: new Date(Date.now() - i * 540_000),
  };
});

const severityColors: Record<string, 'secondary' | 'info' | 'warning' | 'destructive'> = {
  low: 'secondary',
  medium: 'info',
  high: 'warning',
  critical: 'destructive',
};

const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: 'action',
    header: 'Action',
    cell: ({ row }) => (
      <span className="font-mono text-[12px]">{row.original.action}</span>
    ),
  },
  {
    accessorKey: 'actor',
    header: 'Actor',
    cell: ({ row }) => (
      <div>
        <p className="text-[13px] font-medium">{row.original.actor}</p>
        <p className="text-[11px] text-muted-foreground">{row.original.actorRole}</p>
      </div>
    ),
  },
  {
    accessorKey: 'resource',
    header: 'Resource',
    cell: ({ row }) => (
      <div>
        <p className="text-[13px]">{row.original.resource}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{row.original.resourceId}</p>
      </div>
    ),
  },
  {
    accessorKey: 'severity',
    header: 'Severity',
    cell: ({ row }) => (
      <Badge variant={severityColors[row.original.severity]} className="capitalize">
        {row.original.severity}
      </Badge>
    ),
    size: 90,
  },
  {
    accessorKey: 'ip',
    header: 'IP Address',
    cell: ({ row }) => (
      <span className="font-mono text-[12px] text-muted-foreground">{row.original.ip}</span>
    ),
    size: 130,
  },
  {
    accessorKey: 'createdAt',
    header: 'Timestamp',
    cell: ({ row }) => (
      <span className="text-[12px] text-muted-foreground">
        {format(row.original.createdAt, 'MMM d, HH:mm:ss')}
      </span>
    ),
    size: 140,
  },
];

export default function AuditLogsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Audit Logs</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Security and compliance event trail</p>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          SOC 2 compliant · 90-day retention
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Events today', value: '284' },
          { label: 'Critical events', value: '3', alert: true },
          { label: 'Unique actors', value: '12' },
          { label: 'Failed logins', value: '8' },
        ].map(({ label, value, alert }) => (
          <div key={label} className={`rounded-xl border bg-card p-4 shadow-sm ${alert ? 'border-destructive/30' : ''}`}>
            <p className="text-[13px] text-muted-foreground">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${alert ? 'text-destructive' : ''}`}>{value}</p>
          </div>
        ))}
      </div>

      <DataTable
        data={MOCK_LOGS}
        columns={columns}
        searchKey="action"
        searchPlaceholder="Filter by action…"
      />
    </div>
  );
}
