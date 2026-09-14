"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
      return;
    }
    const from = params.get("from") || "/";
    router.push(from);
    router.refresh();
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand side */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white">
        <div className="flex items-center gap-3 text-xl font-bold">
          <span className="w-10 h-10 rounded-xl bg-white/20 grid place-items-center">🧾</span>
          GenTech
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Sell faster.<br />Manage smarter.
          </h1>
          <p className="text-white/80 max-w-md">
            Point of sale, inventory, customers and reports — all in one clean,
            modern dashboard.
          </p>
        </div>
        <div className="text-white/60 text-sm">© GenTech</div>
      </div>

      {/* Form side */}
      <div className="grid place-items-center p-6 bg-slate-100 dark:bg-slate-950">
        <form
          onSubmit={submit}
          className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8"
        >
          <h2 className="text-2xl font-bold mb-1 text-slate-900 dark:text-slate-100">
            Welcome back 👋
          </h2>
          <p className="text-slate-500 text-sm mb-6">Sign in to your POS account.</p>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 text-sm px-3 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            className="w-full mb-4 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
          />

          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full mb-6 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg py-2 px-3">
            Demo · <strong>admin@pos.com</strong> / admin123 &nbsp;•&nbsp;
            <strong>cashier@pos.com</strong> / cashier123
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
