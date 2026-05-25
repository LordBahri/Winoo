'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PLACEHOLDER = [
  { month: 'Jan', users: 0, pets: 0 },
  { month: 'Feb', users: 0, pets: 0 },
  { month: 'Mar', users: 0, pets: 0 },
  { month: 'Apr', users: 0, pets: 0 },
  { month: 'May', users: 0, pets: 0 },
  { month: 'Jun', users: 0, pets: 0 },
];

export function GrowthChart() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold">Platform Growth</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={PLACEHOLDER}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="month" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip />
          <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} name="Users" />
          <Line type="monotone" dataKey="pets" stroke="hsl(var(--destructive))" strokeWidth={2} name="Pets" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
