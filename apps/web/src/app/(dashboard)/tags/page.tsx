'use client';

import { DataTable } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Tag, Plus } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow, format } from 'date-fns';

interface NfcTag {
  id: string;
  uid: string;
  status: 'linked' | 'unlinked' | 'deactivated';
  petName: string | null;
  petId: string | null;
  totalScans: number;
  lastScan: Date | null;
  activatedAt: Date | null;
  batchId: string;
}

const MOCK_TAGS: NfcTag[] = Array.from({ length: 80 }, (_, i) => {
  const linked = i % 4 !== 0;
  return {
    id: `tag_${i + 1}`,
    uid: `04:${String(i + 1).padStart(2, '0')}:AB:CD:${String(Math.floor(i / 16)).padStart(2, '0')}:EF`,
    status: i % 20 === 0 ? 'deactivated' : linked ? 'linked' : 'unlinked',
    petName: linked ? ['Max', 'Luna', 'Charlie', 'Bella', 'Rocky'][i % 5] : null,
    petId: linked ? `pet_${i + 1}` : null,
    totalScans: linked ? Math.floor(Math.random() * 500) : 0,
    lastScan: linked ? new Date(Date.now() - Math.random() * 8e8) : null,
    activatedAt: linked ? new Date(Date.now() - Math.random() * 1e10) : null,
    batchId: `BATCH-2024-${String(Math.floor(i / 10) + 1).padStart(2, '0')}`,
  };
});

const statusColors: Record<string, 'success' | 'secondary' | 'destructive'> = {
  linked: 'success',
  unlinked: 'secondary',
  deactivated: 'destructive',
};

const columns: ColumnDef<NfcTag>[] = [
  {
    accessorKey: 'uid',
    header: 'Tag UID',
    cell: ({ row }) => (
      <span className="font-mono text-[12px] text-muted-foreground">{row.original.uid}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={statusColors[row.original.status]} className="capitalize">
        {row.original.status}
      </Badge>
    ),
    size: 100,
  },
  {
    accessorKey: 'petName',
    header: 'Linked Pet',
    cell: ({ row }) => row.original.petName ? (
      <div>
        <p className="text-[13px] font-medium">{row.original.petName}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{row.original.petId}</p>
      </div>
    ) : (
      <span className="text-[12px] text-muted-foreground/50">— unassigned</span>
    ),
  },
  {
    accessorKey: 'totalScans',
    header: 'Scans',
    size: 80,
    cell: ({ row }) => (
      <span className="text-[13px] tabular-nums">{row.original.totalScans.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'lastScan',
    header: 'Last Scan',
    cell: ({ row }) => row.original.lastScan ? (
      <span className="text-[13px] text-muted-foreground">
        {formatDistanceToNow(row.original.lastScan, { addSuffix: true })}
      </span>
    ) : (
      <span className="text-[12px] text-muted-foreground/50">Never</span>
    ),
  },
  {
    accessorKey: 'batchId',
    header: 'Batch',
    cell: ({ row }) => (
      <span className="font-mono text-[11px] text-muted-foreground">{row.original.batchId}</span>
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
          <DropdownMenuItem>View scans</DropdownMenuItem>
          <DropdownMenuItem>Reassign pet</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive>Deactivate tag</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export default function TagsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">NFC Tags</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage all NFC tag inventory and assignments</p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Register Batch
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Tags', value: '121,450', color: '' },
          { label: 'Linked', value: '91,088', color: 'text-emerald-600' },
          { label: 'Unlinked', value: '29,100', color: 'text-muted-foreground' },
          { label: 'Deactivated', value: '1,262', color: 'text-destructive' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-[13px] text-muted-foreground">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <DataTable
        data={MOCK_TAGS}
        columns={columns}
        searchKey="uid"
        searchPlaceholder="Search by UID or batch…"
      />
    </div>
  );
}
