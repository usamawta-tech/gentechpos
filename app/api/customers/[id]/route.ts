import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/customers/[id]
export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  const customerId = Number(id);
  if (!Number.isInteger(customerId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    data.name = name;
  }
  if (body.email !== undefined) data.email = String(body.email).trim() || null;
  if (body.phone !== undefined) data.phone = String(body.phone).trim() || null;

  try {
    const customer = await prisma.customer.update({ where: { id: customerId }, data });
    return NextResponse.json(customer);
  } catch {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
}

// DELETE /api/customers/[id]
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const customerId = Number(id);
  if (!Number.isInteger(customerId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    await prisma.customer.delete({ where: { id: customerId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
}
