import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LOW_STOCK_THRESHOLD } from "@/lib/format";

// GET /api/dashboard -> today's sales total, order count, low-stock products
export async function GET() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [todaySales, todayCount, lowStock, totalProducts, recentSales] = await Promise.all([
    prisma.sale.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: startOfToday } },
    }),
    prisma.sale.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.product.findMany({
      where: { stock: { lte: LOW_STOCK_THRESHOLD } },
      orderBy: { stock: "asc" },
      take: 20,
    }),
    prisma.product.count(),
    prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    }),
  ]);

  return NextResponse.json({
    todaySalesTotal: todaySales._sum.total ?? 0,
    todayOrders: todayCount,
    lowStock,
    totalProducts,
    recentSales,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
  });
}
