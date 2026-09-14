"use client";

import { useEffect, useState } from "react";
import type { Customer } from "@/lib/types";

type FormState = { id?: number; name: string; email: string; phone: string };
const emptyForm: FormState = { name: "", email: "", phone: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/customers");
    setCustomers(await res.json());
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Name is required");
    setSaving(true);
    const res = await fetch(form.id ? `/api/customers/${form.id}` : "/api/customers", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setError(d.error || "Failed to save");
    }
    setShowForm(false);
    load();
  }

  async function remove(c: Customer) {
    if (!confirm(`Delete ${c.name}?`)) return;
    const res = await fetch(`/api/customers/${c.id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(query.toLowerCase()) ||
      (c.phone ?? "").includes(query)
  );

  const inputCls =
    "w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500";

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-slate-500 text-sm">Keep track of your regulars.</p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setError("");
            setShowForm(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
        >
          + Add Customer
        </button>
      </header>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍  Search customers…"
        className={`mb-4 ${inputCls}`}
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wide">
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Phone</th>
              <th className="px-5 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                  No customers found.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3 text-slate-500">{c.email || "—"}</td>
                  <td className="px-5 py-3 text-slate-500">{c.phone || "—"}</td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => {
                        setForm({ id: c.id, name: c.name, email: c.email ?? "", phone: c.phone ?? "" });
                        setError("");
                        setShowForm(true);
                      }}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium mr-4"
                    >
                      Edit
                    </button>
                    <button onClick={() => remove(c)} className="text-rose-600 hover:underline font-medium">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
            <h2 className="text-lg font-bold mb-4">{form.id ? "Edit Customer" : "Add Customer"}</h2>
            {error && (
              <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 text-sm px-3 py-2 rounded-lg mb-3">
                {error}
              </div>
            )}
            <div className="space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Name"
                className={inputCls}
                autoFocus
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email (optional)"
                className={inputCls}
              />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone (optional)"
                className={inputCls}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300"
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
