'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GrowthChart } from '@/components/charts/growth-chart';
import { RevenueChart } from '@/components/charts/revenue-chart';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const SCAN_BY_HOUR = Array.from({ length: 24 }, (_, h) => ({
  hour: `${String(h).padStart(2, '0')}:00`,
  scans: Math.floor(50 + Math.sin((h - 6) * 0.5) * 80 + Math.random() * 30),
}));

const DEVICE_DATA = [
  { name: 'iPhone', value: 48, fill: 'hsl(262,83%,58%)' },
  { name: 'Android', value: 38, fill: 'hsl(221,83%,53%)' },
  { name: 'Other', value: 14, fill: 'hsl(var(--muted-foreground))' },
];

const GEO_DATA = [
  { country: 'USA', scans: 42100 },
  { country: 'UK', scans: 18400 },
  { country: 'France', scans: 14200 },
  { country: 'Germany', scans: 11800 },
  { country: 'Canada', scans: 9400 },
  { country: 'Australia', scans: 7600 },
  { country: 'Japan', scans: 6800 },
  { country: 'Other', scans: 10700 },
];

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground/60">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Platform-wide metrics and insights</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Scans" value="121,000" sub="All time" />
        <StatCard label="Daily Active Tags" value="4,218" sub="Last 24 hours" />
        <StatCard label="Avg Scans / Tag" value="5.2" sub="Per active tag" />
        <StatCard label="Unique Countries" value="34" sub="Scan origins" />
      </div>

      <Tabs defaultValue="growth">
        <TabsList>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="scans">Scan Patterns</TabsTrigger>
          <TabsTrigger value="geo">Geography</TabsTrigger>
        </TabsList>

        <TabsContent value="growth">
          <div className="grid gap-6 lg:grid-cols-2">
            <GrowthChart />
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold">Device Distribution</h3>
              <p className="mb-4 text-[12px] text-muted-foreground">Scan device types breakdown</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={DEVICE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {DEVICE_DATA.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Legend formatter={(v) => <span className="text-[12px] text-muted-foreground">{v}</span>} />
                  <Tooltip formatter={(v) => [`${v}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueChart />
        </TabsContent>

        <TabsContent value="scans">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold">Scans by Hour of Day</h3>
            <p className="mb-4 text-[12px] text-muted-foreground">Average scan distribution across 24 hours</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={SCAN_BY_HOUR} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="scans" fill="hsl(262,83%,58%)" radius={[3, 3, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="geo">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold">Scans by Country</h3>
            <p className="mb-4 text-[12px] text-muted-foreground">Top countries by scan volume</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={GEO_DATA} layout="vertical" margin={{ top: 4, right: 24, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip formatter={(v: number) => [v.toLocaleString(), 'Scans']} contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))' }} />
                <Bar dataKey="scans" fill="hsl(221,83%,53%)" radius={[0, 4, 4, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
