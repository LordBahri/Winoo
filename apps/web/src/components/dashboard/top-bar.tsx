'use client';

import { signOut } from 'next-auth/react';

interface TopBarProps {
  user: { name?: string | null; email?: string | null; role?: string };
}

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <span className="text-sm text-muted-foreground">
        {user.role ?? 'ADMIN'}
      </span>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">{user.name ?? user.email}</span>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
