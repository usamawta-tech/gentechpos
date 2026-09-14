"use client";

import { useEffect, useState } from "react";

type Form = { storeName: string; address: string; phone: string; footer: string };

export default function SettingsPage() {
  const [form, setForm] = useState<Form>({ storeName: "", address: "", phone: "", footer: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) =>
        setForm({
          storeName: d.storeName ?? "",
          address: d.address ?? "",
          phone: d.phone ?? "",
          footer: d.footer ?? "",
        })
      )
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!form.storeName.trim()) return setError("Store name is required");
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setError(d.error || "Failed to save");
    }
    setMessage("Saved! Your store details now appear on receipts and invoices.");
  }

  const inputCls =
    "w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500";

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Store Settings</h1>
        <p className="text-slate-500 text-sm">
          Set your store name and details. These appear on printed and emailed invoices.
        </p>
      </header>

      <form
        onSubmit={save}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4"
      >
        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : (
          <>
            {error && (
              <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 text-sm px-3 py-2 rounded-lg">
                {message}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Store name</label>
              <input
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                placeholder="e.g. Ali Mart"
                className={inputCls}
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-1">Shown at the top of every invoice.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. Shop 12, Main Bazaar, Lahore"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. 0300-1234567"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Receipt footer message</label>
              <input
                value={form.footer}
                onChange={(e) => setForm({ ...form, footer: e.target.value })}
                placeholder="e.g. Thank you for shopping with us!"
                className={inputCls}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
