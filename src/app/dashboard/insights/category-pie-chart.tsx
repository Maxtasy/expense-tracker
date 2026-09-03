"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Slice = { name: string; value: number; color: string };

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-lg">
      <span className="text-fg">{name}</span>
      <span className="ml-1.5 font-medium text-fg-muted">{value.toFixed(2)}</span>
    </div>
  );
}

export function CategoryPieChart({ title, data }: { title: string; data: Slice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="mb-3 rounded-xl border border-border bg-surface/30 p-3">
      <h2 className="mb-2 text-sm font-medium text-fg">{title}</h2>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-fg-muted">No data for this period.</p>
      ) : (
        <>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="85%"
                  strokeWidth={0}
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {data.map((slice) => (
                    <Cell key={slice.name} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {data.map((slice) => (
              <div key={slice.name} className="flex items-center gap-2 text-xs">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-fg">{slice.name}</span>
                <span className="shrink-0 text-fg-muted">{total > 0 ? ((slice.value / total) * 100).toFixed(0) : 0}%</span>
                <span className="w-16 shrink-0 text-right font-medium text-fg">{slice.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
