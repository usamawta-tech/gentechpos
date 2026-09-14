import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { money, formatDate, invoiceNo } from "@/lib/format";
import { getTransport, getPreviewUrl } from "@/lib/mailer";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/sales/[id]/email  { email }
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const saleId = Number(id);
  if (!Number.isInteger(saleId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const to = String(body.email ?? "").trim();
  if (!to || !to.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: true },
  });
  if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

  const store = await prisma.storeSetting.findUnique({ where: { id: 1 } });
  const storeName = store?.storeName || "GenTech Store";
  const footer = store?.footer || "Thank you for your purchase!";

  const rows = sale.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 0">${i.name} × ${i.quantity}</td><td style="padding:4px 0;text-align:right">${money(
          i.price * i.quantity
        )}</td></tr>`
    )
    .join("");

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;color:#0f172a">
    <h2 style="text-align:center;margin:0">${storeName}</h2>
    ${store?.address ? `<p style="text-align:center;color:#64748b;margin:2px 0">${store.address}</p>` : ""}
    ${store?.phone ? `<p style="text-align:center;color:#64748b;margin:2px 0">Tel: ${store.phone}</p>` : ""}
    <p style="text-align:center;color:#64748b;margin:4px 0 4px">INVOICE</p>
    <p style="text-align:center;font-weight:bold;margin:0 0 12px">${invoiceNo(sale)}</p>
    <p style="color:#64748b;font-size:13px">${formatDate(sale.createdAt)} · ${sale.paymentMethod}</p>
    <table style="width:100%;border-top:1px dashed #cbd5e1;border-bottom:1px dashed #cbd5e1;font-size:14px">${rows}</table>
    <table style="width:100%;font-size:14px;margin-top:8px">
      <tr><td>Subtotal</td><td style="text-align:right">${money(sale.subtotal)}</td></tr>
      ${sale.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-${money(sale.discount)}</td></tr>` : ""}
      <tr><td>Tax</td><td style="text-align:right">${money(sale.tax)}</td></tr>
      <tr style="font-weight:bold;font-size:16px"><td>Total</td><td style="text-align:right">${money(sale.total)}</td></tr>
    </table>
    <p style="text-align:center;color:#64748b;margin-top:16px">${footer}</p>
  </div>`;

  try {
    const { transporter, from, isTest } = await getTransport();
    const info = await transporter.sendMail({
      from,
      to,
      subject: `Your invoice from ${storeName} — ${invoiceNo(sale)}`,
      html,
    });
    const previewUrl = getPreviewUrl(info);
    return NextResponse.json({ ok: true, isTest, previewUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
