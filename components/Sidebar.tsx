"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import type { SessionPayload } from "@/lib/session";

const baseLinks = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/pos", label: "POS", icon: "🧾" },
  { href: "/products", label: "Products", icon: "📦" },
  { href: "/sales", label: "Sales History", icon: "🕑" },
  { href: "/reports", label: "Reports", icon: "📈" },
  { href: "/customers", label: "Customers", icon: "🧑‍🤝‍🧑" },
];

export default function Sidebar({ user }: { user: SessionPayload }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [...baseLinks];
  if (user.role === "ADMIN") {
    links.push({ href: "/staff", label: "Staff", icon: "👥" });
    links.push({ href: "/settings", label: "Settings", icon: "⚙️" });
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="md:h-screen md:w-60 md:fixed md:flex md:flex-col bg-slate-900 text-slate-100 print:hidden">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-slate-800">
        <span className="w-9 h-9 rounded-xl bg-indigo-500 grid place-items-center text-lg">
          🧾
        </span>
        <span className="font-bold text-lg tracking-tight">GenTech</span>
        <div className="ml-auto md:hidden">
          <ThemeToggle />
        </div>
      </div>

      <nav className="flex md:flex-col gap-1 p-3 overflow-x-auto">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              isActive(l.href)
                ? "bg-indigo-500 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto p-3 border-t border-slate-800 hidden md:block">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-sm font-semibold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs text-slate-400 capitalize">{user.role.toLowerCase()}</div>
          </div>
          <ThemeToggle />
        </div>
        <button
          onClick={logout}
          className="mt-1 w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          ⎋ Log out
        </button>
      </div>

      {/* Mobile logout */}
      <button
        onClick={logout}
        className="md:hidden px-4 py-2 text-sm text-slate-300 text-left"
      >
        ⎋ Log out ({user.name})
      </button>
    </aside>
  );
}
