"use client";

import { useCallback, useEffect, useState } from "react";
import { money } from "@/lib/format";
import BarChart from "@/components/BarChart";

type ReportData = {
  from: string;
  to: string;
  totalRevenue: number;
  orders: number;
  avgOrder: number;
  totalDiscount: number;
  totalTax: number;
  payments: Record<string, { count: number; total: number }>;
  topProducts: { name: string; qty: number; revenue: number }[];
  days: { date: string; label: string; total: number; orders: number }[];
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoStr(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [from, setFrom] = useState(daysAgoStr(6));
  const [to, setTo] = useState(todayStr());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/reports?from=${from}&to=${to}`);
    setData(await res.json());
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const cardCls =
    "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm";
  const inputCls =
    "px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500";

  const stats = data
    ? [
        { label: "Revenue", value: money(data.totalRevenue) },
        { label: "Orders", value: String(data.orders) },
        { label: "Avg. Order", value: money(data.avgOrder) },
        { label: "Tax Collected", value: money(data.totalTax) },
      ]
    : [];

  function quick(range: number) {
    setFrom(daysAgoStr(range));
    setTo(todayStr());
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-slate-500 text-sm">Analyse sales over any date range.</p>
      </header>

      {/* Range controls */}
      <div className={`${cardCls} p-4 mb-6 flex flex-wrap items-end gap-3`}>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
          <input type="date" value={to} min={from} max={todayStr()} onChange={(e) => setTo(e.target.value)} className={inputCls} />
        </div>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => quick(6)} className="px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">7 days</button>
          <button onClick={() => quick(29)} className="px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">30 days</button>
          <button onClick={() => quick(89)} className="px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">90 days</button>
        </div>
      </div>

      {loading || !data ? (
        <div className={`${cardCls} p-12 text-center text-slate-400`}>Loading…</div>
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className={`${cardCls} p-5`}>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-slate-500 text-sm">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <section className={`${cardCls} p-5`}>
            <h2 className="font-semibold mb-4">Sales by Day</h2>
            <BarChart data={data.days.map((d) => ({ label: d.label, value: d.total }))} />
          </section>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Payment breakdown */}
            <section className={`${cardCls} p-5`}>
              <h2 className="font-semibold mb-4">Payment Methods</h2>
              {Object.keys(data.payments).length === 0 ? (
                <p className="text-slate-400 text-sm">No sales in this range.</p>
              ) : (
                <ul className="space-y-2">
                  {Object.entries(data.payments).map(([method, p]) => (
                    <li key={method} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{method}</span>
                      <span className="text-slate-500">
                        {p.count} order(s) · {money(p.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Top products */}
            <section className={`${cardCls} p-5`}>
              <h2 className="font-semibold mb-4">Top Products</h2>
              {data.topProducts.length === 0 ? (
                <p className="text-slate-400 text-sm">No sales in this range.</p>
              ) : (
                <ul className="space-y-2">
                  {data.topProducts.map((p, i) => (
                    <li key={p.name} className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">
                        <span className="text-slate-400 mr-2">{i + 1}.</span>
                        {p.name}
                      </span>
                      <span className="text-slate-500 whitespace-nowrap">
                        {p.qty} sold · {money(p.revenue)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
