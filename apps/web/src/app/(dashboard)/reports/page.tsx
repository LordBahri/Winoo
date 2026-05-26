'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Download, Users, PawPrint, Tag, Activity,
  BarChart2, ShieldCheck, DollarSign, AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: 'users' | 'pets' | 'operations' | 'financial' | 'security';
  format: 'CSV' | 'PDF' | 'XLSX';
  lastGenerated?: Date;
}

const REPORTS: ReportTemplate[] = [
  { id: 'r1', name: 'User Export', description: 'All users with roles, status, and subscription info', icon: Users, category: 'users', format: 'CSV', lastGenerated: new Date(Date.now() - 8.64e7) },
  { id: 'r2', name: 'Pet Registry', description: 'Complete pet database with owner and tag linkage', icon: PawPrint, category: 'pets', format: 'XLSX', lastGenerated: new Date(Date.now() - 1.728e8) },
  { id: 'r3', name: 'Tag Inventory', description: 'NFC tag stock, activation status, and scan totals', icon: Tag, category: 'operations', format: 'CSV', lastGenerated: new Date(Date.now() - 3.456e8) },
  { id: 'r4', name: 'Scan Events Log', description: 'Raw scan events with location and device metadata', icon: Activity, category: 'operations', format: 'CSV' },
  { id: 'r5', name: 'Lost Pet Report', description: 'Historical and active lost pet alerts with resolution status', icon: AlertTriangle, category: 'pets', format: 'PDF' },
  { id: 'r6', name: 'Revenue Summary', description: 'MRR, ARR, churn, and plan breakdown', icon: DollarSign, category: 'financial', format: 'XLSX', lastGenerated: new Date(Date.now() - 2.592e8) },
  { id: 'r7', name: 'Growth Analytics', description: 'Month-over-month user and pet growth with trend charts', icon: BarChart2, category: 'financial', format: 'PDF' },
  { id: 'r8', name: 'Audit Trail', description: 'Security events, admin actions, and access log', icon: ShieldCheck, category: 'security', format: 'CSV', lastGenerated: new Date(Date.now() - 4.32e8) },
];

const categoryColors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'secondary'> = {
  users: 'info',
  pets: 'success',
  operations: 'warning',
  financial: 'default',
  security: 'secondary',
};

const formatColors: Record<string, string> = {
  CSV: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  PDF: 'bg-red-500/10 text-red-600 dark:text-red-400',
  XLSX: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Generate and export platform data reports</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Reports generated', value: '148', sub: 'This month' },
          { label: 'Total exports', value: '1.2k', sub: 'All time' },
          { label: 'Scheduled reports', value: '4', sub: 'Active schedules' },
          { label: 'Data freshness', value: '< 5min', sub: 'Last sync' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-[13px] text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/60">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.id} className="flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm hover:border-primary/30 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14px] font-medium">{report.name}</p>
                  <Badge variant={categoryColors[report.category]} className="capitalize text-[10px]">
                    {report.category}
                  </Badge>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${formatColors[report.format]}`}>
                    {report.format}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">{report.description}</p>
                {report.lastGenerated && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground/60">
                    Last generated {format(report.lastGenerated, 'MMM d, yyyy')}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" className="shrink-0 h-8 gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
