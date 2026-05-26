'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MapPin, Phone, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LostReport {
  id: string;
  petName: string;
  species: string;
  breed: string;
  owner: string;
  ownerPhone: string;
  city: string;
  country: string;
  lastSeenAt: Date;
  reportedAt: Date;
  status: 'active' | 'found' | 'closed';
  scansAfterReport: number;
}

const MOCK_REPORTS: LostReport[] = [
  { id: 'lr_1', petName: 'Max', species: '🐕', breed: 'Golden Retriever', owner: 'Alice Martin', ownerPhone: '+1-555-0123', city: 'Paris', country: 'France', lastSeenAt: new Date(Date.now() - 8.64e7), reportedAt: new Date(Date.now() - 9e7), status: 'active', scansAfterReport: 12 },
  { id: 'lr_2', petName: 'Luna', species: '🐈', breed: 'Persian', owner: 'Bob Chen', ownerPhone: '+44-7700-900123', city: 'London', country: 'UK', lastSeenAt: new Date(Date.now() - 1.7e8), reportedAt: new Date(Date.now() - 1.8e8), status: 'active', scansAfterReport: 4 },
  { id: 'lr_3', petName: 'Charlie', species: '🐕', breed: 'Beagle', owner: 'Carol Davis', ownerPhone: '+1-555-0456', city: 'New York', country: 'USA', lastSeenAt: new Date(Date.now() - 3.6e5), reportedAt: new Date(Date.now() - 7.2e5), status: 'active', scansAfterReport: 28 },
  { id: 'lr_4', petName: 'Bella', species: '🐕', breed: 'Labrador', owner: 'David Kim', ownerPhone: '+82-10-1234-5678', city: 'Seoul', country: 'South Korea', lastSeenAt: new Date(Date.now() - 4.32e8), reportedAt: new Date(Date.now() - 4.5e8), status: 'found', scansAfterReport: 7 },
  { id: 'lr_5', petName: 'Milo', species: '🐈', breed: 'Siamese', owner: 'Emma Wilson', ownerPhone: '+1-555-0789', city: 'Toronto', country: 'Canada', lastSeenAt: new Date(Date.now() - 6.48e8), reportedAt: new Date(Date.now() - 6.6e8), status: 'closed', scansAfterReport: 2 },
];

const statusConfig = {
  active: { color: 'destructive' as const, label: 'Active Alert', icon: AlertTriangle },
  found: { color: 'success' as const, label: 'Found', icon: CheckCircle2 },
  closed: { color: 'secondary' as const, label: 'Closed', icon: CheckCircle2 },
};

export default function LostPetsPage() {
  const active = MOCK_REPORTS.filter((r) => r.status === 'active');
  const resolved = MOCK_REPORTS.filter((r) => r.status !== 'active');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Lost Pets</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Monitor and manage active lost pet alerts</p>
        </div>
        <Badge variant="destructive" className="gap-1.5 text-sm px-3 py-1">
          <AlertTriangle className="h-3.5 w-3.5" />
          {active.length} Active Alerts
        </Badge>
      </div>

      {/* Active alerts */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-destructive">Active Alerts</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((report) => (
            <div key={report.id} className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{report.species}</span>
                  <div>
                    <p className="font-semibold">{report.petName}</p>
                    <p className="text-[12px] text-muted-foreground">{report.breed}</p>
                  </div>
                </div>
                <Badge variant="destructive" className="text-[10px]">LOST</Badge>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-[13px]">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{report.city}, {report.country}</span>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>Last seen {formatDistanceToNow(report.lastSeenAt, { addSuffix: true })}</span>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{report.owner} · {report.ownerPhone}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                <p className="text-[12px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{report.scansAfterReport}</span> scans after report
                </p>
                <Button size="sm" variant="outline" className="h-7 text-[12px]">
                  Mark found
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resolved */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Resolved</h2>
        <div className="rounded-xl border bg-card shadow-sm divide-y">
          {resolved.map((report) => {
            const cfg = statusConfig[report.status];
            return (
              <div key={report.id} className="flex items-center gap-4 px-5 py-3">
                <span className="text-xl">{report.species}</span>
                <div className="flex-1">
                  <p className="text-[13px] font-medium">{report.petName} · {report.breed}</p>
                  <p className="text-[12px] text-muted-foreground">{report.city}, {report.country} · {report.owner}</p>
                </div>
                <Badge variant={cfg.color}>{cfg.label}</Badge>
                <p className="text-[12px] text-muted-foreground hidden sm:block">
                  {formatDistanceToNow(report.reportedAt, { addSuffix: true })}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
