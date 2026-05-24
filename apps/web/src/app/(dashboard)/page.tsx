import { Suspense } from 'react';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { ScanEventFeed } from '@/components/dashboard/scan-event-feed';
import { LostPetsMap } from '@/components/dashboard/lost-pets-map';
import { GrowthChart } from '@/components/charts/growth-chart';

export const metadata = { title: 'Overview' };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Overview</h1>

      <Suspense fallback={<div className="grid grid-cols-4 gap-4">{Array.from({length: 4}).map((_,i) => <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />)}</div>}>
        <KpiCards />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<div className="h-64 rounded-lg bg-muted animate-pulse" />}>
          <GrowthChart />
        </Suspense>

        <Suspense fallback={<div className="h-64 rounded-lg bg-muted animate-pulse" />}>
          <LostPetsMap />
        </Suspense>
      </div>

      <Suspense fallback={<div className="h-96 rounded-lg bg-muted animate-pulse" />}>
        <ScanEventFeed />
      </Suspense>
    </div>
  );
}
