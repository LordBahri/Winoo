'use client';

import { DataTable } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PawPrint } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';

interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'other';
  breed: string;
  owner: string;
  status: 'active' | 'lost' | 'found' | 'deceased';
  tagUid: string | null;
  lastScan: Date | null;
  createdAt: Date;
}

const SPECIES_EMOJI: Record<string, string> = { dog: '🐕', cat: '🐈', bird: '🐦', other: '🐾' };

const MOCK_PETS: Pet[] = Array.from({ length: 60 }, (_, i) => ({
  id: `pet_${i + 1}`,
  name: ['Max', 'Luna', 'Charlie', 'Bella', 'Rocky', 'Milo', 'Coco', 'Daisy', 'Buddy', 'Nala'][i % 10],
  species: (['dog', 'cat', 'cat', 'dog', 'bird', 'dog', 'cat', 'other', 'dog', 'cat'] as const)[i % 10],
  breed: ['Golden Retriever', 'Persian', 'Siamese', 'Labrador', 'Parrot', 'Poodle', 'British Shorthair', 'Mixed', 'Beagle', 'Ragdoll'][i % 10],
  owner: `User #${Math.floor(i / 3) + 1}`,
  status: i % 20 === 0 ? 'lost' : i % 35 === 0 ? 'found' : i % 50 === 0 ? 'deceased' : 'active',
  tagUid: i % 4 !== 0 ? `NFC-${String(i + 1).padStart(6, '0')}` : null,
  lastScan: i % 4 !== 0 ? new Date(Date.now() - Math.random() * 5e8) : null,
  createdAt: new Date(Date.now() - Math.random() * 1e10),
}));

const statusColors: Record<string, 'success' | 'destructive' | 'warning' | 'secondary'> = {
  active: 'success',
  lost: 'destructive',
  found: 'warning',
  deceased: 'secondary',
};

const columns: ColumnDef<Pet>[] = [
  {
    accessorKey: 'name',
    header: 'Pet',
    cell: ({ row }) => {
      const p = row.original;
      return (
        <div className="flex items-center gap-3">
          <span className="text-xl">{SPECIES_EMOJI[p.species]}</span>
          <div>
            <p className="text-[13px] font-medium">{p.name}</p>
            <p className="text-[12px] text-muted-foreground">{p.breed}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={statusColors[row.original.status]} className="capitalize">
        {row.original.status}
      </Badge>
    ),
    size: 90,
  },
  {
    accessorKey: 'owner',
    header: 'Owner',
    cell: ({ row }) => <span className="text-[13px]">{row.original.owner}</span>,
  },
  {
    accessorKey: 'tagUid',
    header: 'NFC Tag',
    cell: ({ row }) => row.original.tagUid ? (
      <span className="font-mono text-[12px] text-muted-foreground">{row.original.tagUid}</span>
    ) : (
      <span className="text-[12px] text-muted-foreground/50">— unlinked</span>
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
          <DropdownMenuItem>View details</DropdownMenuItem>
          <DropdownMenuItem>View owner</DropdownMenuItem>
          <DropdownMenuItem>Scan history</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive>Mark as lost</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export default function PetsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Pets</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">All registered pets across the platform</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="destructive" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            3 currently lost
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Pets', value: '84,120' },
          { label: 'Dogs', value: '41,240' },
          { label: 'Cats', value: '28,890' },
          { label: 'Tagged', value: '63,480' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-[13px] text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <DataTable
        data={MOCK_PETS}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search by name or breed…"
      />
    </div>
  );
}
