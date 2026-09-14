import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money, formatDate, LOW_STOCK_THRESHOLD } from "@/lib/format";
import BarChart from "@/components/BarChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 6 * 86400000);
  weekAgo.setHours(0, 0, 0, 0);

  const [todayAgg, todayOrders, lowStock, totalProducts, recentSales, weekSales] =
    await Promise.all([
      prisma.sale.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.sale.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.product.findMany({
        where: { stock: { lte: LOW_STOCK_THRESHOLD } },
        orderBy: { stock: "asc" },
      }),
      prisma.product.count(),
      prisma.sale.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { items: true },
      }),
      prisma.sale.findMany({
        where: { createdAt: { gte: weekAgo } },
        select: { createdAt: true, total: true },
      }),
    ]);

  const todaySales = todayAgg._sum.total ?? 0;

  // Build a 7-day series
  const days: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d.getTime() + 86400000);
    const total = weekSales
      .filter((s) => s.createdAt >= d && s.createdAt < next)
      .reduce((n, s) => n + s.total, 0);
    days.push({
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      value: Math.round(total * 100) / 100,
    });
  }

  const stats = [
    { label: "Today's Sales", value: money(todaySales), icon: "💰", tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" },
    { label: "Today's Orders", value: String(todayOrders), icon: "🧾", tint: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400" },
    { label: "Total Products", value: String(totalProducts), icon: "📦", tint: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" },
    { label: "Low-Stock Items", value: String(lowStock.length), icon: "⚠️", tint: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" },
  ];

  const card = "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm";

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-500 text-sm">Overview of your store today.</p>
        </div>
        <Link
          href="/pos"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
        >
          🧾 New Sale
        </Link>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className={`${card} p-5`}>
            <div className={`w-11 h-11 rounded-xl grid place-items-center text-xl mb-3 ${s.tint}`}>
              {s.icon}
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-slate-500 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      <section className={`${card} p-5 mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Sales · Last 7 Days</h2>
          <Link href="/reports" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
            Full reports →
          </Link>
        </div>
        <BarChart data={days} />
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Low stock */}
        <section className={card}>
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold">Low Stock Alerts</h2>
            <span className="text-xs text-slate-400">≤ {LOW_STOCK_THRESHOLD} in stock</span>
          </div>
          <div className="p-3">
            {lowStock.length === 0 ? (
              <p className="text-slate-400 text-sm p-4 text-center">All products are well stocked. 🎉</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {lowStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-2 py-3">
                    <div>
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.category}</div>
                    </div>
                    <span
                      className={`text-sm font-semibold px-2.5 py-1 rounded-lg ${
                        p.stock === 0
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                      }`}
                    >
                      {p.stock} left
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Recent sales */}
        <section className={card}>
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold">Recent Sales</h2>
            <Link href="/sales" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              View all
            </Link>
          </div>
          <div className="p-3">
            {recentSales.length === 0 ? (
              <p className="text-slate-400 text-sm p-4 text-center">No sales yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentSales.map((s) => (
                  <li key={s.id} className="flex items-center justify-between px-2 py-3">
                    <div>
                      <div className="font-medium text-sm">Order #{s.id}</div>
                      <div className="text-xs text-slate-400">
                        {formatDate(s.createdAt)} · {s.items.length} item(s) · {s.paymentMethod}
                      </div>
                    </div>
                    <span className="font-semibold text-sm">{money(s.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
