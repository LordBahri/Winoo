import { Users, PawPrint, Tag, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { cn, formatNumber, formatCurrency } from '@/lib/utils';

// Mock data — replace with: await adminApi.get<Stats>('/admin/stats')
const MOCK_STATS = {
  totalUsers: 12840,
  activePets: 84120,
  activeTags: 121450,
  mrr: 48200,
  userGrowth: 12.4,
  petGrowth: 8.7,
  tagGrowth: 15.2,
  mrrGrowth: 22.1,
};

export async function KpiCards() {
  const stats = MOCK_STATS;

  const cards = [
    {
      label: 'Total Users',
      value: formatNumber(stats.totalUsers),
      icon: Users,
      delta: stats.userGrowth,
      sub: 'vs last month',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Active Pets',
      value: formatNumber(stats.activePets),
      icon: PawPrint,
      delta: stats.petGrowth,
      sub: 'vs last month',
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'NFC Tags Linked',
      value: formatNumber(stats.activeTags),
      icon: Tag,
      delta: stats.tagGrowth,
      sub: 'vs last month',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'MRR',
      value: formatCurrency(stats.mrr),
      icon: DollarSign,
      delta: stats.mrrGrowth,
      sub: 'monthly recurring',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, delta, sub, color, bg }) => (
        <div key={label} className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', bg)}>
              <Icon className={cn('h-4.5 w-4.5', color)} />
            </div>
            <span
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
              )}
            >
              {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(delta)}%
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{label}</p>
          <p className="mt-1 text-[11px] text-muted-foreground/60">{sub}</p>
        </div>
      ))}
    </div>
  );
}
