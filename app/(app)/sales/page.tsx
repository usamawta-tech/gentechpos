import { prisma } from "@/lib/prisma";
import { money, formatDate, invoiceNo } from "@/lib/format";

export const dynamic = "force-dynamic";

const paymentTint: Record<string, string> = {
  Cash: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Card: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  Other: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
};

export default async function SalesPage() {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, cashier: { select: { name: true } }, customer: true },
    take: 200,
  });

  const totalRevenue = sales.reduce((n, s) => n + s.total, 0);
  const card = "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm";

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Sales History</h1>
        <p className="text-slate-500 text-sm">
          {sales.length} order(s) · {money(totalRevenue)} total revenue
        </p>
      </header>

      {sales.length === 0 ? (
        <div className={`${card} p-12 text-center text-slate-400`}>
          No sales recorded yet. Head to the POS to make your first sale.
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((s) => (
            <div key={s.id} className={`${card} p-5`}>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{invoiceNo(s)}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${paymentTint[s.paymentMethod] ?? paymentTint.Other}`}>
                      {s.paymentMethod}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Order #{s.id} ·
                    {formatDate(s.createdAt)}
                    {s.cashier?.name && <> · by {s.cashier.name}</>}
                    {s.customer?.name && <> · {s.customer.name}</>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{money(s.total)}</div>
                  <div className="text-xs text-slate-400">
                    {s.items.reduce((n, i) => n + i.quantity, 0)} item(s)
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid sm:grid-cols-2 gap-x-8 gap-y-1">
                {s.items.map((i) => (
                  <div key={i.id} className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">
                      {i.name} <span className="text-slate-400">× {i.quantity}</span>
                    </span>
                    <span className="text-slate-500">{money(i.price * i.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-6 text-xs text-slate-400">
                <span>Subtotal: {money(s.subtotal)}</span>
                {s.discount > 0 && <span>Discount: -{money(s.discount)}</span>}
                <span>Tax: {money(s.tax)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
