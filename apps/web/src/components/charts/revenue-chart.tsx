'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DATA = [
  { month: 'Jan', mrr: 18400, churn: 1200 },
  { month: 'Feb', mrr: 22100, churn: 900 },
  { month: 'Mar', mrr: 28900, churn: 1400 },
  { month: 'Apr', mrr: 32000, churn: 800 },
  { month: 'May', mrr: 38200, churn: 1100 },
  { month: 'Jun', mrr: 43100, churn: 700 },
  { month: 'Jul', mrr: 46800, churn: 600 },
  { month: 'Aug', mrr: 48200, churn: 500 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-xs">
      <p className="mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex gap-2">
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium" style={{ color: p.fill }}>${p.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

export function RevenueChart() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-1">
        <h3 className="text-sm font-semibold">MRR vs Churn</h3>
        <p className="text-[12px] text-muted-foreground">Monthly recurring revenue &amp; churn</p>
      </div>
      <ResponsiveContainer width="100%" height={220} className="mt-4">
        <BarChart data={DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', radius: 4 }} />
          <Bar dataKey="mrr" name="MRR" fill="hsl(262,83%,58%)" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="churn" name="Churn" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} maxBarSize={32} fillOpacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
