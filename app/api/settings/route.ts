import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const DEFAULTS = {
  id: 1,
  storeName: "GenTech Store",
  address: "",
  phone: "",
  footer: "Thank you for your purchase!",
};

// Ensures the single settings row exists and returns it.
async function getOrCreate() {
  const existing = await prisma.storeSetting.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.storeSetting.create({ data: DEFAULTS });
}

// GET /api/settings -> store info (any authenticated user; needed for receipts)
export async function GET() {
  const settings = await getOrCreate();
  return NextResponse.json(settings);
}

// PUT /api/settings -> update store info (admin only)
export async function PUT(request: Request) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can change store settings" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const data: Record<string, string> = {};
  if (body.storeName !== undefined) {
    const name = String(body.storeName).trim();
    if (!name) return NextResponse.json({ error: "Store name cannot be empty" }, { status: 400 });
    data.storeName = name;
  }
  if (body.address !== undefined) data.address = String(body.address).trim();
  if (body.phone !== undefined) data.phone = String(body.phone).trim();
  if (body.footer !== undefined) data.footer = String(body.footer).trim();

  await getOrCreate();
  const updated = await prisma.storeSetting.update({ where: { id: 1 }, data });
  return NextResponse.json(updated);
}
