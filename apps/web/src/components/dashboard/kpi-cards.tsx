import { adminApi } from '@/lib/api-client';
import { Users, PawPrint, Tag, DollarSign } from 'lucide-react';

interface Stats {
  totalUsers: number;
  activePets: number;
  activeTags: number;
  mrr: number;
  userGrowth: number;
  petGrowth: number;
}

export async function KpiCards() {
  const stats = await adminApi.get<Stats>('/admin/stats');

  const cards = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      delta: `+${stats.userGrowth}% this month`,
      positive: stats.userGrowth >= 0,
    },
    {
      label: 'Active Pets',
      value: stats.activePets.toLocaleString(),
      icon: PawPrint,
      delta: `+${stats.petGrowth}% this month`,
      positive: stats.petGrowth >= 0,
    },
    {
      label: 'Active NFC Tags',
      value: stats.activeTags.toLocaleString(),
      icon: Tag,
      delta: 'All linked tags',
      positive: true,
    },
    {
      label: 'MRR',
      value: `$${stats.mrr.toLocaleString()}`,
      icon: DollarSign,
      delta: 'Monthly recurring',
      positive: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, delta, positive }) => (
        <div key={label} className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          <p className={`mt-1 text-xs ${positive ? 'text-green-600' : 'text-red-500'}`}>{delta}</p>
        </div>
      ))}
    </div>
  );
}
