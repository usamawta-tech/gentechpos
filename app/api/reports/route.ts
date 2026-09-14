import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/format";

// GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  const to = toStr ? new Date(toStr) : new Date();
  to.setHours(23, 59, 59, 999);
  const from = fromStr ? new Date(fromStr) : new Date(to.getTime() - 6 * 86400000);
  from.setHours(0, 0, 0, 0);

  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: from, lte: to } },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  const totalRevenue = round2(sales.reduce((n, s) => n + s.total, 0));
  const orders = sales.length;
  const avgOrder = orders ? round2(totalRevenue / orders) : 0;
  const totalDiscount = round2(sales.reduce((n, s) => n + s.discount, 0));
  const totalTax = round2(sales.reduce((n, s) => n + s.tax, 0));

  // Payment breakdown
  const payments: Record<string, { count: number; total: number }> = {};
  for (const s of sales) {
    const p = (payments[s.paymentMethod] ??= { count: 0, total: 0 });
    p.count++;
    p.total = round2(p.total + s.total);
  }

  // Top products (by revenue)
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  for (const s of sales) {
    for (const it of s.items) {
      const key = it.name;
      const e = (productMap[key] ??= { name: it.name, qty: 0, revenue: 0 });
      e.qty += it.quantity;
      e.revenue = round2(e.revenue + it.price * it.quantity);
    }
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Daily series across the range
  const days: { date: string; label: string; total: number; orders: number }[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    const dayStart = new Date(cursor);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(cursor);
    dayEnd.setHours(23, 59, 59, 999);
    const daySales = sales.filter(
      (s) => s.createdAt >= dayStart && s.createdAt <= dayEnd
    );
    days.push({
      date: dayStart.toISOString().slice(0, 10),
      label: dayStart.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      total: round2(daySales.reduce((n, s) => n + s.total, 0)),
      orders: daySales.length,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return NextResponse.json({
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    totalRevenue,
    orders,
    avgOrder,
    totalDiscount,
    totalTax,
    payments,
    topProducts,
    days,
  });
}
