'use client';

import { useState } from 'react';
import { DataTable } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserPlus, Shield, Ban } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'active' | 'suspended' | 'pending';
  pets: number;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
}

const MOCK_USERS: User[] = Array.from({ length: 48 }, (_, i) => ({
  id: `usr_${i + 1}`,
  name: ['Alice Martin', 'Bob Chen', 'Carol Davis', 'David Kim', 'Emma Wilson', 'Frank Lee', 'Grace Park', 'Henry Brown'][i % 8],
  email: `user${i + 1}@example.com`,
  role: i === 0 ? 'SUPER_ADMIN' : i < 3 ? 'ADMIN' : 'USER',
  status: i % 7 === 0 ? 'suspended' : i % 11 === 0 ? 'pending' : 'active',
  pets: Math.floor(Math.random() * 5),
  plan: i % 5 === 0 ? 'enterprise' : i % 3 === 0 ? 'pro' : 'free',
  createdAt: new Date(Date.now() - Math.random() * 1e10),
}));

const roleColors: Record<string, 'default' | 'secondary' | 'info'> = {
  SUPER_ADMIN: 'default',
  ADMIN: 'info',
  USER: 'secondary',
};

const statusColors: Record<string, 'success' | 'destructive' | 'warning'> = {
  active: 'success',
  suspended: 'destructive',
  pending: 'warning',
};

const planColors: Record<string, 'secondary' | 'info' | 'default'> = {
  free: 'secondary',
  pro: 'info',
  enterprise: 'default',
};

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'User',
    cell: ({ row }) => {
      const u = row.original;
      const initials = u.name.split(' ').map((n) => n[0]).join('').toUpperCase();
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-[13px] font-medium leading-tight">{u.name}</p>
            <p className="text-[12px] text-muted-foreground">{u.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => <Badge variant={roleColors[row.original.role]}>{row.original.role.replace('_', ' ')}</Badge>,
    size: 120,
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
    accessorKey: 'plan',
    header: 'Plan',
    cell: ({ row }) => (
      <Badge variant={planColors[row.original.plan]} className="capitalize">
        {row.original.plan}
      </Badge>
    ),
    size: 100,
  },
  {
    accessorKey: 'pets',
    header: 'Pets',
    size: 70,
    cell: ({ row }) => <span className="text-[13px] tabular-nums">{row.original.pets}</span>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => (
      <span className="text-[13px] text-muted-foreground">
        {formatDistanceToNow(row.original.createdAt, { addSuffix: true })}
      </span>
    ),
  },
  {
    id: 'actions',
    size: 48,
    cell: ({ row }) => {
      const u = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View profile</DropdownMenuItem>
            <DropdownMenuItem>
              <Shield className="mr-2 h-3.5 w-3.5" />
              Change role
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive>
              <Ban className="mr-2 h-3.5 w-3.5" />
              {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function UsersPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Users</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Button size="sm" className="gap-1.5">
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: '12,840', delta: '+12.4%' },
          { label: 'Pro / Enterprise', value: '3,210', delta: '25% of users' },
          { label: 'Suspended', value: '48', delta: '0.4% of users' },
        ].map(({ label, value, delta }) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-[13px] text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/70">{delta}</p>
          </div>
        ))}
      </div>

      <DataTable
        data={MOCK_USERS}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search users…"
      />
    </div>
  );
}
