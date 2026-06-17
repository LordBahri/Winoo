'use client';

import { AlertTriangle, MapPin } from 'lucide-react';

const LOST_PETS = [
  { name: 'Max', city: 'Paris', country: 'FR', time: '2h ago' },
  { name: 'Luna', city: 'London', country: 'GB', time: '5h ago' },
  { name: 'Charlie', city: 'New York', country: 'US', time: '30m ago' },
];

export function LostPetsMap() {
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b">
        <h3 className="text-sm font-semibold">Active Lost Pets</h3>
        <span className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
          {LOST_PETS.length} alerts
        </span>
      </div>
      <div className="divide-y">
        {LOST_PETS.map((p) => (
          <div key={p.name} className="flex items-center gap-3 px-5 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium">{p.name}</p>
              <p className="flex items-center gap-1 text-[12px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {p.city}, {p.country}
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground/70">{p.time}</span>
          </div>
        ))}
      </div>
      <div className="flex h-24 items-center justify-center border-t bg-muted/30 text-[12px] text-muted-foreground">
        Interactive map · integrate Leaflet here
      </div>
    </div>
  );
}
