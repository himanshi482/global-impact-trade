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
  }, []);

  if (user && user.role !== "ADMIN") {
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
          <FieldLabel>Platform Administration &amp; Control Center</FieldLabel>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--brass)]/20 pb-6 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-[var(--paper)]">
                GlobeBridge Admin Console
              </h1>
              <p className="mt-1 text-xs text-[var(--muted)] font-mono">
                Manage accounts, buyers, suppliers, shipments, HS codes, and incoming trade requests.
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
                    Review Leads →
                  </Link>
                </div>
              </div>

              {/* Sub-page Navigation Cards */}
              <div className="grid gap-6 md:grid-cols-3">
                <Link
                  href="/admin/users"
                  className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-xl group"
                >
                  <div className="text-2xl">👥</div>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)] group-hover:text-[var(--brass)]">
                    User Accounts &amp; Roles
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    View registered accounts, toggle administrator access, or deactivate users.
                  </p>
                </Link>

                <Link
                  href="/admin/buyers"
                  className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-xl group"
                >
                  <div className="text-2xl">🌍</div>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)] group-hover:text-[var(--brass)]">
                    Buyers Database CRUD
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    Add new international buyer entities, edit verification status, or update trade volumes.
                  </p>
                </Link>

                <Link
                  href="/admin/suppliers"
                  className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-xl group"
                >
                  <div className="text-2xl">🚢</div>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)] group-hover:text-[var(--brass)]">
                    Suppliers Directory CRUD
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    Manage global seller profiles, HS Code assignments, and export capacities.
                  </p>
                </Link>

                <Link
                  href="/admin/shipments"
                  className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-xl group"
                >
                  <div className="text-2xl">📦</div>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)] group-hover:text-[var(--brass)]">
                    Shipments Records CRUD
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    Create, edit, or delete bill of lading shipment records. Search by product, HS code, or country.
                  </p>
                </Link>

                <Link
                  href="/admin/hs-codes"
                  className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-xl group"
                >
                  <div className="text-2xl">📋</div>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)] group-hover:text-[var(--brass)]">
                    HS Codes Database CRUD
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    Manage the ITC-HS code tariff database with duty rates. Add, edit, or remove HS code entries.
                  </p>
                </Link>

                <Link
                  href="/admin/requests"
                  className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-xl group"
                >
                  <div className="text-2xl">📬</div>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)] group-hover:text-[var(--brass)]">
                    Contact &amp; Demo Requests
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    Track incoming business inquiries and update lead status from NEW to CONTACTED or CLOSED.
                  </p>
                </Link>

                <Link
                  href="/admin/subscriptions"
                  className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-xl group"
                >
                  <div className="text-2xl">💳</div>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)] group-hover:text-[var(--brass)]">
                    Subscription Plans &amp; Quotas
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    Manually assign a plan to any user and see their unlock quota usage (no payment gateway wired up).
                  </p>
                </Link>

                <Link
                  href="/admin/leads"
                  className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-xl group"
                >
                  <div className="text-2xl">🎯</div>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)] group-hover:text-[var(--brass)]">
                    Lead Pipeline Activity
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                    See every user&apos;s saved leads across the pipeline — filter by company, status, or entity type.
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
