import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/format";
import { getSession } from "@/lib/auth";

// GET /api/sales -> list sales (most recent first) with items
export async function GET() {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, cashier: { select: { name: true } }, customer: true },
    take: 200,
  });
  return NextResponse.json(sales);
}

type IncomingItem = { productId: number; quantity: number };

// POST /api/sales -> create a sale, validate stock, reduce stock atomically
export async function POST(request: Request) {
  const session = await getSession();

  let body: {
    items?: IncomingItem[];
    discount?: number;
    discountType?: "amount" | "percent";
    discountValue?: number;
    taxRate?: number;
    paymentMethod?: string;
    customerId?: number | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const discountType = body.discountType === "percent" ? "percent" : "amount";
  // `discountValue` is preferred; fall back to legacy `discount` (a fixed amount).
  const discountValue = Math.max(0, Number(body.discountValue ?? body.discount) || 0);
  const taxRate = Math.max(0, Number(body.taxRate) || 0);
  const paymentMethod = ["Cash", "Card", "Other"].includes(String(body.paymentMethod))
    ? String(body.paymentMethod)
    : "Cash";
  const customerId = body.customerId ? Number(body.customerId) : null;

  try {
    const sale = await prisma.$transaction(async (tx) => {
      // Load products and validate stock
      const ids = items.map((i) => Number(i.productId));
      const products = await tx.product.findMany({ where: { id: { in: ids } } });
      const byId = new Map(products.map((p) => [p.id, p]));

      let subtotal = 0;
      const lineItems: { productId: number; name: string; price: number; quantity: number }[] = [];

      for (const item of items) {
        const pid = Number(item.productId);
        const qty = Math.trunc(Number(item.quantity));
        const product = byId.get(pid);
        if (!product) throw new Error(`Product ${pid} not found`);
        if (qty <= 0) throw new Error(`Invalid quantity for ${product.name}`);
        if (product.stock < qty) {
          throw new Error(`Not enough stock for ${product.name} (have ${product.stock}, need ${qty})`);
        }
        subtotal += product.price * qty;
        lineItems.push({ productId: pid, name: product.name, price: product.price, quantity: qty });
      }

      subtotal = round2(subtotal);
      const rawDiscount =
        discountType === "percent" ? (subtotal * discountValue) / 100 : discountValue;
      const discount = round2(Math.min(Math.max(0, rawDiscount), subtotal));
      const tax = round2(((subtotal - discount) * taxRate) / 100);
      const total = round2(subtotal - discount + tax);

      // Reduce stock
      for (const li of lineItems) {
        await tx.product.update({
          where: { id: li.productId },
          data: { stock: { decrement: li.quantity } },
        });
      }

      // Create sale + items
      return tx.sale.create({
        data: {
          subtotal,
          discount,
          tax,
          total,
          paymentMethod,
          cashierId: session?.id ?? null,
          customerId,
          items: {
            create: lineItems.map((li) => ({
              productId: li.productId,
              name: li.name,
              price: li.price,
              quantity: li.quantity,
            })),
          },
        },
        include: { items: true, customer: true, cashier: { select: { name: true } } },
      });
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to complete sale";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
