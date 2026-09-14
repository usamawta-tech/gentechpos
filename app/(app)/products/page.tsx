"use client";

import { useEffect, useState } from "react";
import { money, LOW_STOCK_THRESHOLD } from "@/lib/format";
import type { Product } from "@/lib/types";

type FormState = {
  id?: number;
  name: string;
  barcode: string;
  price: string;
  stock: string;
  category: string;
};

const emptyForm: FormState = { name: "", barcode: "", price: "", stock: "", category: "" };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/products");
    setProducts(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setForm({
      id: p.id,
      name: p.name,
      barcode: p.barcode ?? "",
      price: String(p.price),
      stock: String(p.stock),
      category: p.category,
    });
    setError("");
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Name is required");
    if (form.price === "" || Number(form.price) < 0) return setError("Enter a valid price");

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      barcode: form.barcode.trim(),
      price: Number(form.price),
      stock: form.stock === "" ? 0 : Number(form.stock),
      category: form.category.trim() || "General",
    };

    const res = await fetch(form.id ? `/api/products/${form.id}` : "/api/products", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return setError(data.error || "Failed to save");
    }
    setShowForm(false);
    load();
  }

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    if (res.ok) load();
    else alert("Failed to delete product.");
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase()) ||
      (p.barcode ?? "").includes(query)
  );

  const inputCls =
    "w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500";

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-slate-500 text-sm">Manage your catalogue and stock.</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
        >
          + Add Product
        </button>
      </header>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍  Search by name, category or barcode…"
        className={`mb-4 ${inputCls}`}
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold text-right">Price</th>
                <th className="px-5 py-3 font-semibold text-right">Stock</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3">
                      <div className="font-medium">{p.name}</div>
                      {p.barcode && (
                        <div className="text-xs text-slate-400 font-mono">🏷 {p.barcode}</div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{p.category}</td>
                    <td className="px-5 py-3 text-right">{money(p.price)}</td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                          p.stock === 0
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                            : p.stock <= LOW_STOCK_THRESHOLD
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(p)}
                        className="text-rose-600 hover:underline font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-slate-900/50 grid place-items-center p-4 z-50"
          onClick={() => setShowForm(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl"
          >
            <h2 className="text-lg font-bold mb-4">{form.id ? "Edit Product" : "Add Product"}</h2>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 text-sm px-3 py-2 rounded-lg mb-3">
                {error}
              </div>
            )}

            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`mb-4 ${inputCls}`}
              placeholder="e.g. Cappuccino"
              autoFocus
            />

            <label className="block text-sm font-medium mb-1">Barcode (optional)</label>
            <input
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              className={`mb-4 font-mono ${inputCls}`}
              placeholder="Scan or type barcode"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Price (Rs)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className={`mb-4 ${inputCls}`}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className={`mb-4 ${inputCls}`}
                  placeholder="0"
                />
              </div>
            </div>

            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={`mb-6 ${inputCls}`}
              placeholder="e.g. Beverage"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
