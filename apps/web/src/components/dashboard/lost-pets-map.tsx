'use client';

export function LostPetsMap() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold">Lost Pets Map</h3>
      <div className="flex h-52 items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
        Map requires active lost-pet reports
      </div>
    </div>
  );
}
