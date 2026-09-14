export const CURRENCY = "Rs";

export function money(n: number): string {
  const rounded = Math.round((n + Number.EPSILON) * 100) / 100;
  return (
    CURRENCY +
    " " +
    rounded.toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Auto-generated invoice/bill number, derived from the sale id + date.
// e.g. INV-20260908-0042 (stable, unique, no schema change needed).
export function invoiceNo(sale: { id: number; createdAt: Date | string }): string {
  const d = typeof sale.createdAt === "string" ? new Date(sale.createdAt) : sale.createdAt;
  const ymd =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  return `INV-${ymd}-${String(sale.id).padStart(4, "0")}`;
}

export const PAYMENT_METHODS = ["Cash", "Card", "Other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const LOW_STOCK_THRESHOLD = 10;
