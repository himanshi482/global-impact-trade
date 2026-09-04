"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

// Public navigation links when visitor is on home or unauthenticated
const publicNavLinks = [
  { href: "/", label: "Home" },
  { href: "/trade-data", label: "Trade Data" },
  { href: "/export-potential-test", label: "Export Test", badge: "Free" },
  { href: "/hs-codes", label: "HS Codes" },
  { href: "/market-analysis", label: "Market Trends" },
  { href: "/supplier-discovery", label: "Suppliers" },
  { href: "/buyer-discovery", label: "Buyers" },
  { href: "/export-planner", label: "Export Planner", badge: "New" },
  { href: "/features", label: "Features" },
  { href: "/plans-pricing", label: "Pricing" },
];

// App workspace navigation links when user IS logged in (outside admin)
const appNavLinks = [
  { href: "/dashboard", label: "Dashboard", highlight: true },
  { href: "/buyer-discovery", label: "Buyer Discovery" },
  { href: "/supplier-discovery", label: "Supplier Discovery" },
  { href: "/my-leads", label: "Lead CRM" },
  { href: "/market-analysis", label: "Market Analysis" },
  { href: "/export-planner", label: "Export Decision Planner", badge: "New" },
  { href: "/alerts", label: "Market Alerts" },
  { href: "/notifications", label: "Notifications" },
  { href: "/trade-data", label: "Trade Data" },
  { href: "/hs-codes", label: "HS Code & Tariffs" },
  { href: "/export-potential-test", label: "Export Potential Test", badge: "Free" },
  { href: "/profile", label: "Profile & Subscriptions" },
];

// Dedicated navigation bar ONLY displayed when inside the Admin Console (/admin/*)
const adminNavLinks = [
  { href: "/admin", label: "Control Center", highlight: true },
  { href: "/admin/analytics", label: "Platform Analytics", badge: "Live" },
  { href: "/admin/users", label: "User Management" },
  { href: "/admin/leads", label: "Lead Management" },
  { href: "/admin/subscriptions", label: "Subscriptions & Quotas" },
  { href: "/admin/buyers", label: "Buyer CRUD" },
  { href: "/admin/suppliers", label: "Supplier CRUD" },
  { href: "/admin/shipments", label: "Shipment CRUD" },
  { href: "/admin/hs-codes", label: "HS Code CRUD" },
  { href: "/admin/requests", label: "Contact / Demo" },
  { href: "/dashboard", label: "← User App" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isAdmin = user && (user.role === "ADMIN" || user.role === "admin");
  const isAdminSection = pathname.startsWith("/admin");
  const isHomePage = pathname === "/";

  // When on home page or visitor: strictly public links (no admin, no my-leads).
  // When inside /admin: show admin navigation.
  // Otherwise when logged in: show user app workspace links.
  let activeLinks;
  if (isAdminSection && isAdmin) {
    activeLinks = adminNavLinks;
  } else if (isHomePage || !user) {
    activeLinks = publicNavLinks;
  } else {
    activeLinks = appNavLinks;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--brass)]/25 bg-[var(--ink)]/95 backdrop-blur shadow-lg">
      <div className="mx-auto flex max-w-[96rem] items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link 
          href={user ? "/dashboard" : "/"} 
          className="flex items-center gap-2 font-display text-xl tracking-tight text-[var(--paper)] shrink-0 mr-4"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded bg-[var(--brass)] font-mono text-xs font-bold text-[var(--ink)]">
            GB
          </span>
          <span className="hidden sm:inline">
            GLOBE<span className="text-[var(--brass)]">BRIDGE</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-2.5 xl:gap-3.5 2xl:gap-4.5 lg:flex overflow-x-auto py-1">
          {activeLinks.map((l) => {
            const isActive = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.08em] px-1.5 py-1 transition shrink-0 ${
                  isActive
                    ? "font-bold text-[var(--brass)] underline underline-offset-8"
                    : l.highlight
                    ? "text-[var(--brass)] font-semibold"
                    : "text-[var(--muted)] hover:text-[var(--paper)]"
                }`}
              >
                {l.label}
                {l.badge && (
                  <span className="ml-1 rounded bg-emerald-950/80 border border-emerald-500/40 px-1 py-0.2 text-[9px] text-emerald-400">
                    {l.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Right CTAs: Active User vs Visitor */}
        <div className="hidden items-center gap-2.5 md:flex shrink-0 ml-4">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Admin Console Switcher (Only visible to admins, separate from normal app links) */}
              {isAdmin && (
                <Link
                  href={isAdminSection ? "/dashboard" : "/admin"}
                  className="rounded-lg bg-amber-500/15 border border-amber-500/40 px-3 py-1.5 font-mono text-[11px] font-bold text-amber-300 hover:bg-amber-500/25 transition flex items-center gap-1.5"
                >
                  <span>{isAdminSection ? "← User Dashboard" : "🛡️ Admin Console"}</span>
                </Link>
              )}

              {/* User Profile Pill */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg bg-[var(--ink-2)] border border-[var(--brass)]/40 px-3.5 py-1.5 font-mono text-xs text-[var(--paper)] hover:border-[var(--brass)] transition shadow"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-[var(--brass)]">{user.name ? user.name.split(" ")[0] : "Member"}</span>
                <span className="text-[10px] text-[var(--muted)] border-l border-[var(--brass)]/20 pl-1.5">
                  {user.company ? user.company.slice(0, 15) : "Enterprise"}
                </span>
              </Link>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={logout}
                className="rounded border border-rose-500/30 bg-rose-950/20 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-rose-300 hover:bg-rose-900/40 hover:text-white transition cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] transition hover:text-[var(--paper)] px-2.5 py-1.5"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded bg-[var(--brass)] px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-[var(--ink)] font-bold transition hover:brightness-110 shadow"
              >
                Register Free
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--paper)] lg:hidden p-2 rounded border border-[var(--brass)]/30"
        >
          {open ? "✕ Close" : "☰ Menu"}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-[var(--brass)]/20 bg-[var(--ink)] px-6 py-4 lg:hidden">
          {activeLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)] hover:text-[var(--paper)] border-b border-[var(--brass)]/10"
            >
              <span>{l.label}</span>
              {l.badge && (
                <span className="rounded bg-emerald-950 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] text-emerald-400">
                  {l.badge}
                </span>
              )}
            </Link>
          ))}

          {user ? (
            <div className="mt-4 flex flex-col gap-2 pt-2 border-t border-[var(--brass)]/20">
              {isAdmin && (
                <Link
                  href={isAdminSection ? "/dashboard" : "/admin"}
                  onClick={() => setOpen(false)}
                  className="rounded bg-amber-500/20 border border-amber-500/50 py-2.5 text-center font-mono text-xs uppercase tracking-wider text-amber-300 font-bold"
                >
                  {isAdminSection ? "← Return to User Dashboard" : "🛡️ Open Admin Console"}
                </Link>
              )}
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="rounded bg-[var(--brass)] py-2.5 text-center font-mono text-xs uppercase tracking-wider text-[var(--ink)] font-bold shadow"
              >
                Open Dashboard ({user.name})
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="rounded border border-rose-500/40 bg-rose-950/20 py-2.5 text-center font-mono text-xs uppercase tracking-wider text-rose-300"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2 pt-2 border-t border-[var(--brass)]/20">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded border border-[var(--brass)]/40 py-2.5 text-center font-mono text-xs uppercase tracking-wider text-[var(--paper)]"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="rounded bg-[var(--brass)] py-2.5 text-center font-mono text-xs uppercase tracking-wider text-[var(--ink)] font-bold"
              >
                Register Free
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
