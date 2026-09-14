"use client";

import { money, formatDate, invoiceNo } from "@/lib/format";
import type { Sale, StoreSetting } from "@/lib/types";

// Off-screen; becomes the only visible element when printing (80mm thermal roll).
export default function Receipt({
  sale,
  amountReceived,
  store,
}: {
  sale: Sale | null;
  amountReceived?: number;
  store?: StoreSetting | null;
}) {
  if (!sale) return null;

  const storeName = store?.storeName || "GenTech Store";
  const footer = store?.footer || "Thank you for your purchase!";

  const change =
    amountReceived != null && amountReceived >= sale.total
      ? amountReceived - sale.total
      : null;

  return (
    <div
      id="receipt"
      className="absolute -left-[9999px] top-0 w-[80mm] bg-white text-black p-3"
      style={{ fontFamily: "'Courier New', monospace", fontSize: 12, lineHeight: 1.45 }}
    >
      <div className="text-center font-bold text-[15px]">{storeName}</div>
      {store?.address && <div className="text-center">{store.address}</div>}
      {store?.phone && <div className="text-center">Tel: {store.phone}</div>}
      <div className="text-center font-bold mt-1">INVOICE</div>
      <div className="border-t border-black my-2" />

      <div className="flex justify-between font-bold">
        <span>Invoice #</span>
        <span>{invoiceNo(sale)}</span>
      </div>
      <div className="flex justify-between">
        <span>Order</span>
        <span>#{sale.id}</span>
      </div>
      <div className="flex justify-between">
        <span>Date</span>
        <span>{formatDate(sale.createdAt)}</span>
      </div>
      <div className="flex justify-between">
        <span>Payment</span>
        <span>{sale.paymentMethod}</span>
      </div>
      {sale.cashier?.name && (
        <div className="flex justify-between">
          <span>Cashier</span>
          <span>{sale.cashier.name}</span>
        </div>
      )}
      {sale.customer?.name && (
        <div className="flex justify-between">
          <span>Customer</span>
          <span>{sale.customer.name}</span>
        </div>
      )}
      <div className="border-t border-dashed border-black my-2" />

      {sale.items.map((i) => (
        <div key={i.id} className="mb-1">
          <div>{i.name}</div>
          <div className="flex justify-between">
            <span>
              {i.quantity} x {money(i.price)}
            </span>
            <span>{money(i.price * i.quantity)}</span>
          </div>
        </div>
      ))}

      <div className="border-t border-dashed border-black my-2" />
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{money(sale.subtotal)}</span>
      </div>
      {sale.discount > 0 && (
        <div className="flex justify-between">
          <span>Discount</span>
          <span>-{money(sale.discount)}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span>Tax</span>
        <span>{money(sale.tax)}</span>
      </div>
      <div className="flex justify-between font-bold text-[15px] mt-1">
        <span>TOTAL</span>
        <span>{money(sale.total)}</span>
      </div>

      {change != null && (
        <>
          <div className="border-t border-black my-2" />
          <div className="flex justify-between">
            <span>Cash</span>
            <span>{money(amountReceived!)}</span>
          </div>
          <div className="flex justify-between">
            <span>Change</span>
            <span>{money(change)}</span>
          </div>
        </>
      )}

      <div className="border-t border-black my-2" />
      <div className="text-center mt-2">{footer}</div>
      <div className="text-center">*{invoiceNo(sale)}*</div>
    </div>
  );
}
