"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthGuard from "../../components/AuthGuard";
import FieldLabel from "../../components/FieldLabel";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || (user.role !== "ADMIN" && user.role !== "admin")) {
      setLoading(false);
      return;
    }
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats", { credentials: "include" });
        const data = await res.json();
        if (res.ok) {
          setStats(data.stats);
        } else {
          setError(data.error || "Access denied or failed to load stats");
        }
      } catch (err) {
        console.error("Admin stats error", err);
        setError("Network error loading admin stats");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user]);

  if (user && user.role !== "ADMIN" && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[var(--ink)] flex items-center justify-center p-6 font-mono text-center">
        <div className="rounded-xl border border-red-500/40 bg-[var(--ink-2)] p-8 max-w-md">
          <span className="text-4xl">🛑</span>
          <h2 className="font-display mt-3 text-2xl text-red-400">Admin Access Restricted</h2>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Your account ({user.email}) does not have administrative privileges.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded bg-[var(--brass)] px-5 py-2.5 text-xs font-bold uppercase text-[var(--ink)]"
          >
            Return to User Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[var(--ink)] py-12 px-6">
        <div className="mx-auto max-w-6xl">
          <FieldLabel>Platform Administration &amp; Governance</FieldLabel>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--brass)]/20 pb-6 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-[var(--paper)]">
                Admin Control Center
              </h1>
              <p className="mt-1 text-xs text-[var(--muted)] font-mono">
                Centralized platform governance: analytics telemetry, accounts, lead pipeline, subscriptions, and database CRUD.
              </p>
            </div>
            <div className="flex gap-2 font-mono text-xs">
              <span className="rounded bg-emerald-950 border border-emerald-500/50 px-3 py-1.5 text-emerald-300 font-bold">
                ● System Operational
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20 font-mono text-xs text-[var(--brass)]">
              <span className="h-4 w-4 rounded-full border-2 border-[var(--brass)] border-t-transparent animate-spin mr-2"></span>
              Loading admin metrics...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-300 font-mono">
              {error}
            </div>
          ) : (
            <div className="space-y-8 font-mono">
              {/* Metrics Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-md">
                  <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider block">Total Users</span>
                  <span className="font-display mt-2 text-3xl text-[var(--paper)] block">{stats?.users || 0}</span>
                  <Link href="/admin/users" className="mt-3 inline-block text-[11px] text-[var(--brass)] hover:underline">
                    Manage Users →
                  </Link>
                </div>

                <div className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-md">
                  <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider block">Foreign Buyers</span>
                  <span className="font-display mt-2 text-3xl text-[var(--paper)] block">{stats?.buyers || 0}</span>
                  <Link href="/admin/buyers" className="mt-3 inline-block text-[11px] text-[var(--brass)] hover:underline">
                    Manage Buyers →
                  </Link>
                </div>

                <div className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-md">
                  <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider block">Verified Suppliers</span>
                  <span className="font-display mt-2 text-3xl text-[var(--paper)] block">{stats?.suppliers || 0}</span>
                  <Link href="/admin/suppliers" className="mt-3 inline-block text-[11px] text-[var(--brass)] hover:underline">
                    Manage Suppliers →
                  </Link>
                </div>

                <div className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-md">
                  <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider block">Shipments</span>
                  <span className="font-display mt-2 text-3xl text-[var(--paper)] block">{stats?.shipments || 0}</span>
                  <Link href="/admin/shipments" className="mt-3 inline-block text-[11px] text-[var(--brass)] hover:underline">
                    Manage Shipments →
                  </Link>
                </div>

                <div className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-md">
                  <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider block">HS Codes</span>
                  <span className="font-display mt-2 text-3xl text-[var(--paper)] block">{stats?.hsCodes || 0}</span>
                  <Link href="/admin/hs-codes" className="mt-3 inline-block text-[11px] text-[var(--brass)] hover:underline">
                    Manage HS Codes →
                  </Link>
                </div>

                <div className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-md">
                  <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider block">Pending Requests</span>
                  <span className="font-display mt-2 text-3xl text-emerald-400 block">
                    {(stats?.pendingContacts || 0) + (stats?.pendingDemos || 0)}
                  </span>
                  <Link href="/admin/requests" className="mt-3 inline-block text-[11px] text-[var(--brass)] hover:underline">
                    Review Inquiries →
                  </Link>
                </div>
              </div>

              {/* Sub-page Navigation Cards — Structured in Exact Order */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* 1. Platform Analytics */}
                <Link
                  href="/admin/analytics"
                  className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-xl group"
                >
                  <div className="text-2xl">📊</div>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)] group-hover:text-[var(--brass)]">
                    Platform Analytics
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    Live system usage metrics, lead conversion funnels, subscription distributions, and API performance telemetry.
                  </p>
                </Link>

                {/* 2. User Management */}
                <Link
                  href="/admin/users"
                  className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-xl group"
                >
                  <div className="text-2xl">👥</div>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)] group-hover:text-[var(--brass)]">
                    User Management
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    View registered user accounts, toggle administrator privileges, inspect verify status, or deactivate accounts.
                  </p>
                </Link>

                {/* 3. Lead Management */}
                <Link
                  href="/admin/leads"
                  className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-xl group"
                >
                  <div className="text-2xl">🎯</div>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)] group-hover:text-[var(--brass)]">
                    Lead Management
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    Full oversight of saved prospective leads across all platform users — filter by company, status, or entity type.
                  </p>
                </Link>

                {/* 4. Subscription & Quota Management */}
                <Link
                  href="/admin/subscriptions"
                  className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-xl group"
                >
                  <div className="text-2xl">💳</div>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)] group-hover:text-[var(--brass)]">
                    Subscription &amp; Quota Management
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    Manually assign plan tiers (Free, Growth, Connect, Conquer) and monitor contact unlock limits and quotas.
                  </p>
                </Link>

                {/* 5. Buyer CRUD */}
                <Link
                  href="/admin/buyers"
                  className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-xl group"
                >
                  <div className="text-2xl">🌍</div>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)] group-hover:text-[var(--brass)]">
                    Buyer CRUD
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    Create, edit, verify, or delete foreign buyer entity profiles, import volumes, and direct procurement contacts.
                  </p>
                </Link>

                {/* 6. Supplier CRUD */}
                <Link
                  href="/admin/suppliers"
                  className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-xl group"
                >
                  <div className="text-2xl">🚢</div>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)] group-hover:text-[var(--brass)]">
                    Supplier CRUD
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    Manage global supplier records, verification badges, product catalogs, HS code coverage, and export capacities.
                  </p>
                </Link>

                {/* 7. Shipment CRUD */}
                <Link
                  href="/admin/shipments"
                  className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-xl group"
                >
                  <div className="text-2xl">📦</div>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)] group-hover:text-[var(--brass)]">
                    Shipment CRUD
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    Add, edit, or delete customs bill of lading records, container counts, declared CIF/FOB values, and port data.
                  </p>
                </Link>

                {/* 8. HS Code CRUD */}
                <Link
                  href="/admin/hs-codes"
                  className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-xl group"
                >
                  <div className="text-2xl">📋</div>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)] group-hover:text-[var(--brass)]">
                    HS Code CRUD
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    Manage the tariff classification database: add new 6-digit HS codes, update duty rates, and configure tax rules.
                  </p>
                </Link>

                {/* 9. Contact/Demo Requests */}
                <Link
                  href="/admin/requests"
                  className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-xl group"
                >
                  <div className="text-2xl">📬</div>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)] group-hover:text-[var(--brass)]">
                    Contact / Demo Requests
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    Track incoming business leads, contact inquiries, and demo bookings. Update status to CONTACTED or CLOSED.
                  </p>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
