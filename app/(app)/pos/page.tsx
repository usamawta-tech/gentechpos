"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { money, round2, invoiceNo, PAYMENT_METHODS, type PaymentMethod } from "@/lib/format";
import type { Product, CartLine, Sale, Customer, StoreSetting } from "@/lib/types";
import Receipt from "@/components/Receipt";

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [store, setStore] = useState<StoreSetting | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<CartLine[]>([]);

  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
  const [taxRate, setTaxRate] = useState("8");
  const [payment, setPayment] = useState<PaymentMethod>("Cash");
  const [received, setReceived] = useState("");
  const [customerId, setCustomerId] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [lastReceived, setLastReceived] = useState<number | undefined>(undefined);
  const [toast, setToast] = useState("");

  // Email receipt state
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailing, setEmailing] = useState(false);
  const [emailResult, setEmailResult] = useState<{ ok: boolean; url?: string | null; msg: string } | null>(null);

  const scanRef = useRef<HTMLInputElement>(null);

  async function loadProducts() {
    const res = await fetch("/api/products");
    setProducts(await res.json());
  }
  async function loadCustomers() {
    const res = await fetch("/api/customers");
    setCustomers(await res.json());
  }

  useEffect(() => {
    loadProducts();
    loadCustomers();
    fetch("/api/settings").then((r) => (r.ok ? r.json() : null)).then(setStore).catch(() => {});
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = category === "All" || p.category === category;
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.barcode ?? "").includes(query.trim());
      return matchCat && matchQ;
    });
  }, [products, query, category]);

  function addToCart(p: Product) {
    setError("");
    setCart((prev) => {
      const found = prev.find((c) => c.productId === p.id);
      if (found) {
        if (found.quantity >= p.stock) return prev;
        return prev.map((c) => (c.productId === p.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      if (p.stock <= 0) return prev;
      return [...prev, { productId: p.id, name: p.name, price: p.price, stock: p.stock, quantity: 1 }];
    });
  }

  // Barcode scanner support: scanners type the code then press Enter.
  function onScanKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const code = query.trim();
    if (!code) return;
    const byBarcode = products.find((p) => p.barcode && p.barcode === code);
    const match = byBarcode || (visible.length === 1 ? visible[0] : undefined);
    if (match) {
      if (match.stock <= 0) {
        setError(`${match.name} is out of stock`);
      } else {
        addToCart(match);
        setQuery("");
        setToast(`Added ${match.name}`);
        setTimeout(() => setToast(""), 1500);
      }
    } else {
      setError(`No product found for "${code}"`);
    }
  }

  function changeQty(productId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.productId !== productId) return c;
          const next = Math.min(c.stock, Math.max(0, c.quantity + delta));
          return { ...c, quantity: next };
        })
        .filter((c) => c.quantity > 0)
    );
  }

  function removeLine(productId: number) {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }

  function clearCart() {
    setCart([]);
    setDiscount("");
    setReceived("");
    setError("");
  }

  const subtotal = round2(cart.reduce((n, c) => n + c.price * c.quantity, 0));
  const discountRaw = Math.max(0, Number(discount) || 0);
  const discountVal = round2(
    Math.min(discountType === "percent" ? (subtotal * discountRaw) / 100 : discountRaw, subtotal)
  );
  const taxVal = round2(((subtotal - discountVal) * (Number(taxRate) || 0)) / 100);
  const total = round2(subtotal - discountVal + taxVal);
  const receivedVal = Number(received) || 0;
  const change = payment === "Cash" && receivedVal >= total ? round2(receivedVal - total) : null;
  const cashShort = payment === "Cash" && received !== "" && receivedVal < total;

  async function completeSale() {
    if (cart.length === 0) return;
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
        discountType,
        discountValue: discountRaw,
        taxRate: Number(taxRate) || 0,
        paymentMethod: payment,
        customerId: customerId ? Number(customerId) : null,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to complete sale");
      return;
    }

    const sale: Sale = await res.json();
    setLastSale(sale);
    setLastReceived(payment === "Cash" && receivedVal >= total ? receivedVal : undefined);
    setEmailResult(null);
    setEmailOpen(false);
    setEmailTo(sale.customer?.email || "");
    clearCart();
    await loadProducts();
    setToast(`${invoiceNo(sale)} completed`);
    setTimeout(() => setToast(""), 3500);
  }

  function printReceipt() {
    if (!lastSale) return;
    // The browser uses document.title as the default "Save as PDF" filename,
    // so set it to the invoice number, print, then restore the original title.
    const originalTitle = document.title;
    document.title = invoiceNo(lastSale);
    const restore = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
    // Fallback restore in case afterprint does not fire (some browsers).
    setTimeout(restore, 1000);
  }

  async function sendEmail() {
    if (!lastSale) return;
    setEmailing(true);
    setEmailResult(null);
    const res = await fetch(`/api/sales/${lastSale.id}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailTo }),
    });
    setEmailing(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEmailResult({ ok: false, msg: data.error || "Failed to send" });
      return;
    }
    setEmailResult({
      ok: true,
      url: data.previewUrl,
      msg: data.isTest ? "Sent to test inbox — preview:" : "Receipt emailed successfully.",
    });
  }

  const inputCls =
    "w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500";

  return (
    <>
    <div className="p-4 md:p-6 grid lg:grid-cols-[1fr_400px] gap-5 max-w-[1400px] mx-auto print:hidden">
      {/* Products */}
      <section className="min-w-0">
        <input
          ref={scanRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onScanKey}
          placeholder="🔍 / 🏷  Search or scan barcode (press Enter)…"
          className="w-full mb-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
        />

        <div className="flex gap-2 flex-wrap mb-4">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
                category === c
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-indigo-400"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {visible.map((p) => {
            const out = p.stock <= 0;
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={out}
                className={`text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm transition ${
                  out ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5 hover:shadow-md"
                }`}
              >
                <div className="font-semibold text-sm mb-0.5 line-clamp-2">{p.name}</div>
                <div className="text-xs text-slate-400 mb-2">{p.category}</div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{money(p.price)}</span>
                  <span className={`text-xs font-medium ${out ? "text-rose-500" : "text-slate-400"}`}>
                    {out ? "Out" : `${p.stock} left`}
                  </span>
                </div>
              </button>
            );
          })}
          {visible.length === 0 && (
            <p className="col-span-full text-center text-slate-400 py-10">No products found.</p>
          )}
        </div>
      </section>

      {/* Cart / Checkout */}
      <aside className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold">Current Order</h2>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-rose-600 font-semibold">
              Clear
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 min-h-[100px]">
          {cart.length === 0 ? (
            <div className="text-center text-slate-400 py-10">
              <div className="text-4xl mb-2">🛒</div>
              <p className="text-sm">Cart is empty.</p>
              <p className="text-xs">Tap a product or scan a barcode.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {cart.map((c) => (
                <li key={c.productId} className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-xs text-slate-400">{money(c.price)} each</div>
                  </div>
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <button onClick={() => changeQty(c.productId, -1)} className="w-7 h-7 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-slate-800">−</button>
                    <span className="w-7 text-center text-sm font-semibold">{c.quantity}</span>
                    <button onClick={() => changeQty(c.productId, 1)} disabled={c.quantity >= c.stock} className="w-7 h-7 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-slate-800 disabled:opacity-30">+</button>
                  </div>
                  <div className="w-16 text-right text-sm font-semibold">{money(c.price * c.quantity)}</div>
                  <button onClick={() => removeLine(c.productId)} className="text-slate-300 hover:text-rose-500 text-sm w-5">✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-b-2xl space-y-2">
          {/* Customer */}
          <label className="text-xs font-medium text-slate-500 block">
            Customer (optional)
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={`mt-1 ${inputCls}`}>
              <option value="">Walk-in</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <div className="text-xs font-medium text-slate-500">
              Discount
              <div className="mt-1 flex gap-1">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder={discountType === "percent" ? "0" : "0.00"}
                  className={inputCls}
                />
                <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setDiscountType("amount")}
                    className={`px-2 text-sm font-semibold ${
                      discountType === "amount"
                        ? "bg-indigo-600 text-white"
                        : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300"
                    }`}
                  >
                    Rs
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("percent")}
                    className={`px-2 text-sm font-semibold ${
                      discountType === "percent"
                        ? "bg-indigo-600 text-white"
                        : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300"
                    }`}
                  >
                    %
                  </button>
                </div>
              </div>
            </div>
            <label className="text-xs font-medium text-slate-500">
              Tax (%)
              <input type="number" min="0" step="0.1" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={`mt-1 ${inputCls}`} />
            </label>
          </div>

          <div className="flex justify-between text-sm text-slate-500"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Discount{discountType === "percent" && discountRaw > 0 ? ` (${discountRaw}%)` : ""}</span>
            <span>-{money(discountVal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500"><span>Tax</span><span>{money(taxVal)}</span></div>
          <div className="flex justify-between font-bold text-lg pt-1 border-t border-dashed border-slate-200 dark:border-slate-700"><span>Total</span><span>{money(total)}</span></div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {PAYMENT_METHODS.map((m) => (
              <button key={m} onClick={() => setPayment(m)} className={`py-2 rounded-lg text-sm font-semibold border transition ${payment === m ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-indigo-400"}`}>{m}</button>
            ))}
          </div>

          {payment === "Cash" && (
            <div className="pt-1">
              <label className="text-xs font-medium text-slate-500">
                Amount received (Rs)
                <input type="number" min="0" step="0.01" value={received} onChange={(e) => setReceived(e.target.value)} placeholder="0.00" className={`mt-1 ${inputCls}`} />
              </label>
              {change != null && (
                <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 font-semibold mt-1"><span>Change</span><span>{money(change)}</span></div>
              )}
              {cashShort && <div className="text-xs text-rose-500 mt-1">Amount is less than total.</div>}
            </div>
          )}

          {error && <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

          <button onClick={completeSale} disabled={cart.length === 0 || submitting || cashShort} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? "Processing…" : `Complete Sale · ${money(total)}`}
          </button>

          {lastSale && (
            <div className="space-y-2 pt-1">
              <div className="flex gap-2">
                <button onClick={printReceipt} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">
                  🖨️ Print invoice
                </button>
                <button onClick={() => { setEmailOpen((v) => !v); setEmailResult(null); }} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">
                  ✉️ Email
                </button>
              </div>

              {emailOpen && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <input type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="customer@email.com" className={inputCls} />
                  <button onClick={sendEmail} disabled={emailing || !emailTo.includes("@")} className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-50">
                    {emailing ? "Sending…" : "Send receipt"}
                  </button>
                  {emailResult && (
                    <div className={`text-xs ${emailResult.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                      {emailResult.msg}{" "}
                      {emailResult.url && (
                        <a href={emailResult.url} target="_blank" rel="noreferrer" className="underline break-all">
                          open
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-3 rounded-xl shadow-lg text-sm z-50 print:hidden">
          ✓ {toast}
        </div>
      )}

    </div>

      {/* Receipt lives OUTSIDE the print:hidden container so it is visible when printing */}
      <Receipt sale={lastSale} amountReceived={lastReceived} store={store} />
    </>
  );
}
