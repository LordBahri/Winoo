'use client';

import { DataTable } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Wifi, Smartphone, Globe } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNow } from 'date-fns';

interface ScanEvent {
  id: string;
  tagUid: string;
  petName: string | null;
  deviceType: string;
  city: string;
  country: string;
  countryCode: string;
  isLostPet: boolean;
  createdAt: Date;
}

const MOCK_SCANS: ScanEvent[] = Array.from({ length: 100 }, (_, i) => ({
  id: `scan_${i + 1}`,
  tagUid: `04:${String(i % 50 + 1).padStart(2, '0')}:AB:CD:EF`,
  petName: i % 5 !== 0 ? ['Max', 'Luna', 'Charlie', 'Bella', 'Rocky'][i % 5] : null,
  deviceType: ['iPhone', 'Android', 'iPhone', 'Android', 'Samsung Galaxy'][i % 5],
  city: ['Paris', 'London', 'New York', 'Seoul', 'Tokyo', 'Berlin', 'Sydney', 'Toronto'][i % 8],
  country: ['France', 'UK', 'USA', 'South Korea', 'Japan', 'Germany', 'Australia', 'Canada'][i % 8],
  countryCode: ['FR', 'GB', 'US', 'KR', 'JP', 'DE', 'AU', 'CA'][i % 8],
  isLostPet: i % 25 === 0,
  createdAt: new Date(Date.now() - i * 180_000),
}));

const columns: ColumnDef<ScanEvent>[] = [
  {
    accessorKey: 'tagUid',
    header: 'Tag UID',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.isLostPet && (
          <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
        )}
        <span className="font-mono text-[12px] text-muted-foreground">{row.original.tagUid}</span>
      </div>
    ),
  },
  {
    accessorKey: 'petName',
    header: 'Pet',
    cell: ({ row }) => row.original.petName ? (
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-medium">{row.original.petName}</span>
        {row.original.isLostPet && <Badge variant="destructive" className="text-[10px] py-0">LOST</Badge>}
      </div>
    ) : (
      <span className="text-[12px] text-muted-foreground/50">Unregistered</span>
    ),
  },
  {
    accessorKey: 'deviceType',
    header: 'Device',
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-[13px]">
        <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
        {row.original.deviceType}
      </div>
    ),
    size: 140,
  },
  {
    accessorKey: 'city',
    header: 'Location',
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-[13px]">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {row.original.city}, {row.original.country}
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Time',
    cell: ({ row }) => (
      <span className="text-[13px] text-muted-foreground">
        {formatDistanceToNow(row.original.createdAt, { addSuffix: true })}
      </span>
    ),
    size: 130,
  },
];

export default function ScanEventsPage() {
  const today = MOCK_SCANS.filter((s) => s.createdAt > new Date(Date.now() - 8.64e7)).length;
  const lostScans = MOCK_SCANS.filter((s) => s.isLostPet).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Scan Events</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Real-time NFC scan activity across all tags</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-emerald-500/10 px-3 py-1.5 text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
          <Wifi className="h-3.5 w-3.5" />
          Live monitoring
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Scans', value: '121,000' },
          { label: 'Today', value: String(today) },
          { label: 'Avg / hour', value: '176' },
          { label: 'Lost pet scans', value: String(lostScans), alert: true },
        ].map(({ label, value, alert }) => (
          <div key={label} className={`rounded-xl border bg-card p-4 shadow-sm ${alert ? 'border-destructive/30 bg-destructive/5' : ''}`}>
            <p className="text-[13px] text-muted-foreground">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${alert ? 'text-destructive' : ''}`}>{value}</p>
          </div>
        ))}
      </div>

      <DataTable
        data={MOCK_SCANS}
        columns={columns}
        searchKey="tagUid"
        searchPlaceholder="Search by tag UID…"
      />
    </div>
  );
}
