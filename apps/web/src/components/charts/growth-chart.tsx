'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DATA = [
  { month: 'Jan', users: 4200, pets: 18400, scans: 31000 },
  { month: 'Feb', users: 5100, pets: 22100, scans: 38000 },
  { month: 'Mar', users: 6800, pets: 28900, scans: 47000 },
  { month: 'Apr', users: 7900, pets: 35000, scans: 58000 },
  { month: 'May', users: 9200, pets: 52000, scans: 74000 },
  { month: 'Jun', users: 10400, pets: 64000, scans: 88000 },
  { month: 'Jul', users: 11800, pets: 73000, scans: 102000 },
  { month: 'Aug', users: 12840, pets: 84120, scans: 121000 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-xs">
      <p className="mb-2 font-medium text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex gap-2">
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{p.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

export function GrowthChart() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Platform Growth</h3>
          <p className="text-[12px] text-muted-foreground">Users, pets &amp; scans over time</p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          +12.4% MoM
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220} className="mt-4">
        <AreaChart data={DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="users" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(262,83%,58%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(262,83%,58%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="pets" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(221,83%,53%)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(221,83%,53%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="users" name="Users" stroke="hsl(262,83%,58%)" strokeWidth={2} fill="url(#users)" dot={false} />
          <Area type="monotone" dataKey="pets" name="Pets" stroke="hsl(221,83%,53%)" strokeWidth={2} fill="url(#pets)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
