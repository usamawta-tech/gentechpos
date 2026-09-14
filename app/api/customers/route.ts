import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/customers -> list
export async function GET() {
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(customers);
}

// POST /api/customers -> create
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim() || null;
  const phone = String(body.phone ?? "").trim() || null;
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const customer = await prisma.customer.create({ data: { name, email, phone } });
  return NextResponse.json(customer, { status: 201 });
}
