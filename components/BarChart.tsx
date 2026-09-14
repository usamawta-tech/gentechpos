"use client";

import { money } from "@/lib/format";

type Point = { label: string; value: number };

export default function BarChart({
  data,
  currency = true,
  height = 180,
}: {
  data: Point[];
  currency?: boolean;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const fmt = (n: number) => (currency ? money(n) : String(n));

  return (
    <div className="w-full">
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max(2, (d.value / max) * (height - 24));
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition">
                {fmt(d.value)}
              </span>
              <div
                className="w-full rounded-t-md bg-indigo-500 hover:bg-indigo-600 transition-all"
                style={{ height: h }}
                title={`${d.label}: ${fmt(d.value)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-slate-400 truncate">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
