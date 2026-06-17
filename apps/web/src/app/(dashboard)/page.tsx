import { Suspense } from 'react';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { ScanEventFeed } from '@/components/dashboard/scan-event-feed';
import { LostPetsMap } from '@/components/dashboard/lost-pets-map';
import { GrowthChart } from '@/components/charts/growth-chart';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, TrendingUp, Globe } from 'lucide-react';

export const metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Welcome back — here&apos;s what&apos;s happening with PetID today.
        </p>
      </div>

      <Suspense fallback={
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      }>
        <KpiCards />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-72 rounded-xl" />}>
          <GrowthChart />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-72 rounded-xl" />}>
          <RevenueChart />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
            <ScanEventFeed />
          </Suspense>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold">Quick Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Avg scans / day', value: '4,218', icon: Activity, bg: 'bg-violet-500/10', fg: 'text-violet-500' },
                { label: 'Active countries', value: '34', icon: Globe, bg: 'bg-blue-500/10', fg: 'text-blue-500' },
                { label: 'Revenue / user', value: '$3.75', icon: TrendingUp, bg: 'bg-emerald-500/10', fg: 'text-emerald-500' },
              ].map(({ label, value, icon: Icon, bg, fg }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                    <Icon className={`h-4 w-4 ${fg}`} />
                  </div>
                  <p className="flex-1 text-[13px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <Suspense fallback={<Skeleton className="h-52 rounded-xl" />}>
            <LostPetsMap />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
