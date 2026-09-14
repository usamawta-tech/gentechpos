import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products  -> list all products (optional ?q= search)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const products = await prisma.product.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { category: { contains: q } },
            { barcode: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}

// POST /api/products -> create a product
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const price = Number(body.price);
    const stock = Number.isFinite(Number(body.stock)) ? Math.trunc(Number(body.stock)) : 0;
    const category = String(body.category ?? "General").trim() || "General";
    const barcode = String(body.barcode ?? "").trim() || null;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }

    if (barcode) {
      const dupe = await prisma.product.findUnique({ where: { barcode } });
      if (dupe) {
        return NextResponse.json({ error: "Barcode already in use" }, { status: 409 });
      }
    }

    const product = await prisma.product.create({
      data: { name, price, stock, category, barcode },
    });
    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
