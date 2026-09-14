import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/products/[id] -> update a product
export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      data.name = name;
    }
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0)
        return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      data.price = price;
    }
    if (body.stock !== undefined) {
      const stock = Math.trunc(Number(body.stock));
      if (!Number.isFinite(stock) || stock < 0)
        return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
      data.stock = stock;
    }
    if (body.category !== undefined) {
      data.category = String(body.category).trim() || "General";
    }
    if (body.barcode !== undefined) {
      const barcode = String(body.barcode).trim() || null;
      if (barcode) {
        const dupe = await prisma.product.findUnique({ where: { barcode } });
        if (dupe && dupe.id !== productId) {
          return NextResponse.json({ error: "Barcode already in use" }, { status: 409 });
        }
      }
      data.barcode = barcode;
    }

    const product = await prisma.product.update({ where: { id: productId }, data });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await prisma.product.delete({ where: { id: productId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}
