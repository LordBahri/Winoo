'use client';

import { signOut } from 'next-auth/react';
import { Bell, Moon, Sun, Search, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useTheme } from '@/app/providers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopBarProps {
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string };
}

export function TopBar({ user }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'AD';

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur">
      {/* Search */}
      <div className="flex flex-1 items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Search users, pets, tags…</span>
        <kbd className="ml-auto hidden rounded border bg-background px-1.5 text-[10px] sm:inline-flex">⌘K</kbd>
      </div>

      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
        </button>

        <div className="mx-2 h-5 w-px bg-border" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent">
              <Avatar className="h-7 w-7">
                {user.image && <AvatarImage src={user.image} alt={user.name ?? ''} />}
                <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-[13px] font-medium leading-tight">{user.name ?? 'Admin'}</p>
                <p className="text-[11px] text-muted-foreground">{user.role ?? 'ADMIN'}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="font-medium">{user.name}</p>
              <p className="text-[11px] font-normal text-muted-foreground">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-3.5 w-3.5" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-3.5 w-3.5" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={() => signOut({ callbackUrl: '/auth/login' })}>
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
