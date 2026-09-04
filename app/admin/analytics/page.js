"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AuthGuard from "../../../components/AuthGuard";
import FieldLabel from "../../../components/FieldLabel";
import { useAuth } from "../../../context/AuthContext";

const STATUS_COLORS = {
  NEW: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  CONTACTED: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  QUALIFIED: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  NEGOTIATING: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  WON: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  LOST: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

const PLAN_BADGES = {
  FREE: "border-slate-500/40 bg-slate-800/50 text-slate-300",
  GROWTH: "border-emerald-500/40 bg-emerald-950/60 text-emerald-300",
  CONNECT: "border-blue-500/40 bg-blue-950/60 text-blue-300",
  CONQUER: "border-[var(--brass)]/50 bg-[var(--brass)]/15 text-[var(--brass)]",
};

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const [range, setRange] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/analytics?range=${range}`, {
        credentials: "include",
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Unable to load analytics");
      }
      setData(body.metrics);
    } catch (err) {
      setError(err.message || "Failed to load platform analytics");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

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

  const leadsTotal = data?.totalLeads || 0;
  const wonLeads = data?.leadsByStatus?.WON || 0;
  const winRate = leadsTotal > 0 ? Math.round((wonLeads / leadsTotal) * 100) : 0;

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[var(--ink)] py-12 px-4 sm:px-6 lg:px-8 text-[var(--paper)]">
        <div className="mx-auto max-w-7xl">
          <FieldLabel>Intelligence &amp; Executive Telemetry</FieldLabel>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--brass)]/20 pb-6 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-3xl sm:text-4xl text-[var(--paper)]">
                  Platform Analytics
                </h1>
                <span className="rounded bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                  Live Engine
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)] font-mono">
                Real-time usage metrics, conversion pipelines, and API observability.
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-lg border border-[var(--brass)]/30 bg-[var(--ink-2)] p-1 font-mono text-xs">
                {[
                  { key: "7", label: "7 Days" },
                  { key: "30", label: "30 Days" },
                  { key: "90", label: "90 Days" },
                  { key: "all", label: "All Time" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setRange(item.key)}
                    className={`rounded px-3 py-1.5 transition ${
                      range === item.key
                        ? "bg-[var(--brass)] text-[var(--ink)] font-bold shadow-sm"
                        : "text-[var(--muted)] hover:text-[var(--paper)]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={loadAnalytics}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3 py-2 font-mono text-xs text-[var(--brass)] hover:border-[var(--brass)] transition disabled:opacity-50 cursor-pointer"
                title="Refresh Analytics"
              >
                <span className={loading ? "animate-spin" : ""}>🔄</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-5 mb-8 text-sm text-red-300 font-mono flex items-center justify-between">
              <div>
                <strong className="block text-red-400 font-bold">Telemetry Query Warning</strong>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={loadAnalytics}
                className="rounded bg-red-900/60 px-3 py-1 text-xs text-red-200 border border-red-500/40 hover:bg-red-800 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {loading && !data ? (
            <div className="flex flex-col items-center justify-center py-24 font-mono text-xs text-[var(--brass)]">
              <span className="h-8 w-8 rounded-full border-2 border-[var(--brass)] border-t-transparent animate-spin mb-4"></span>
              Aggregating platform intelligence telemetry...
            </div>
          ) : data ? (
            <div className="space-y-8 font-mono">
              {/* High-Level KPI Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Users KPI */}
                <div className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-5 shadow-lg relative overflow-hidden group hover:border-[var(--brass)]/50 transition">
                  <div className="flex items-center justify-between text-[11px] text-[var(--muted)] uppercase tracking-wider">
                    <span>Platform Users</span>
                    <span className="text-lg">👥</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-3xl text-[var(--paper)]">
                      {data.users}
                    </span>
                    <span className="text-[11px] text-emerald-400">
                      ({data.activeUsers} active)
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] text-[var(--muted)] border-t border-[var(--brass)]/10 pt-2 flex justify-between">
                    <span>Active accounts ratio:</span>
                    <strong className="text-[var(--paper)]">
                      {data.users > 0 ? Math.round((data.activeUsers / data.users) * 100) : 0}%
                    </strong>
                  </p>
                </div>

                {/* Subscriptions KPI */}
                <div className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-5 shadow-lg relative overflow-hidden group hover:border-[var(--brass)]/50 transition">
                  <div className="flex items-center justify-between text-[11px] text-[var(--muted)] uppercase tracking-wider">
                    <span>Active Subscriptions</span>
                    <span className="text-lg">💳</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-3xl text-[var(--paper)]">
                      {data.activeSubscriptions}
                    </span>
                    <span className="text-[11px] text-[var(--brass)]">
                      Tier Plans
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] text-[var(--muted)] border-t border-[var(--brass)]/10 pt-2 flex justify-between">
                    <span>Paid Tiers Active:</span>
                    <strong className="text-emerald-400">
                      {(data.subscriptionsByPlan?.GROWTH || 0) +
                        (data.subscriptionsByPlan?.CONNECT || 0) +
                        (data.subscriptionsByPlan?.CONQUER || 0)}
                    </strong>
                  </p>
                </div>

                {/* Trade Intelligence KPI */}
                <div className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-5 shadow-lg relative overflow-hidden group hover:border-[var(--brass)]/50 transition">
                  <div className="flex items-center justify-between text-[11px] text-[var(--muted)] uppercase tracking-wider">
                    <span>Decisions Generated</span>
                    <span className="text-lg">📈</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-3xl text-[var(--paper)]">
                      {data.savedAnalyses + data.savedExportPlans}
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">Reports</span>
                  </div>
                  <p className="mt-2 text-[10px] text-[var(--muted)] border-t border-[var(--brass)]/10 pt-2 flex justify-between">
                    <span>{data.savedExportPlans} Plans</span>
                    <span>{data.savedAnalyses} Analyses</span>
                  </p>
                </div>

                {/* Lead Pipeline KPI */}
                <div className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-5 shadow-lg relative overflow-hidden group hover:border-[var(--brass)]/50 transition">
                  <div className="flex items-center justify-between text-[11px] text-[var(--muted)] uppercase tracking-wider">
                    <span>Leads Pipeline</span>
                    <span className="text-lg">🎯</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-3xl text-emerald-400">
                      {leadsTotal}
                    </span>
                    <span className="text-[11px] text-emerald-300">
                      ({wonLeads} won · {winRate}%)
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] text-[var(--muted)] border-t border-[var(--brass)]/10 pt-2 flex justify-between">
                    <span>Contact Unlocks:</span>
                    <strong className="text-[var(--paper)]">{data.unlocks}</strong>
                  </p>
                </div>
              </div>

              {/* Middle Section: Lead Conversion Pipeline & Subscriptions Distribution */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Lead Pipeline Funnel (2 Cols) */}
                <div className="lg:col-span-2 rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 shadow-md">
                  <div className="flex items-center justify-between border-b border-[var(--brass)]/15 pb-4 mb-6">
                    <div>
                      <h2 className="font-display text-xl text-[var(--paper)]">
                        Lead Pipeline &amp; Conversion Funnel
                      </h2>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5">
                        Breakdown of saved prospective buyers &amp; suppliers across lifecycle stages.
                      </p>
                    </div>
                    <Link
                      href="/admin/leads"
                      className="text-xs text-[var(--brass)] hover:underline flex items-center gap-1"
                    >
                      <span>Pipeline View</span>
                      <span>→</span>
                    </Link>
                  </div>

                  {/* Funnel Progress Bars */}
                  <div className="space-y-4">
                    {["NEW", "CONTACTED", "QUALIFIED", "NEGOTIATING", "WON", "LOST"].map((st) => {
                      const count = data.leadsByStatus?.[st] || 0;
                      const pct = leadsTotal > 0 ? Math.round((count / leadsTotal) * 100) : 0;
                      return (
                        <div key={st} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  STATUS_COLORS[st] || "border-slate-500 text-slate-300"
                                }`}
                              >
                                {st}
                              </span>
                              <span className="text-[11px] text-[var(--muted)]">
                                {st === "WON" ? "Closed Deals" : st === "QUALIFIED" ? "High Fit" : ""}
                              </span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--paper)] font-bold">{count}</span>
                              <span className="text-[10px] text-[var(--muted)] w-10 text-right">
                                {pct}%
                              </span>
                            </div>
                          </div>
                          <div className="h-2 w-full rounded-full bg-[var(--ink)] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                st === "WON"
                                  ? "bg-emerald-400"
                                  : st === "LOST"
                                  ? "bg-rose-500"
                                  : st === "NEGOTIATING"
                                  ? "bg-orange-400"
                                  : st === "QUALIFIED"
                                  ? "bg-purple-400"
                                  : st === "CONTACTED"
                                  ? "bg-amber-400"
                                  : "bg-blue-400"
                              }`}
                              style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Entity Type Split */}
                  <div className="mt-6 pt-4 border-t border-[var(--brass)]/15 grid grid-cols-2 gap-4 text-xs">
                    <div className="rounded-lg bg-[var(--ink)] p-3 border border-[var(--brass)]/10">
                      <span className="text-[10px] text-[var(--muted)] uppercase block">
                        Buyer Leads
                      </span>
                      <strong className="text-base text-[var(--paper)]">
                        {data.leadsByEntity?.BUYER || 0}
                      </strong>
                    </div>
                    <div className="rounded-lg bg-[var(--ink)] p-3 border border-[var(--brass)]/10">
                      <span className="text-[10px] text-[var(--muted)] uppercase block">
                        Supplier Leads
                      </span>
                      <strong className="text-base text-[var(--paper)]">
                        {data.leadsByEntity?.SUPPLIER || 0}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Subscriptions & Quota (1 Col) */}
                <div className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="border-b border-[var(--brass)]/15 pb-4 mb-4 flex items-center justify-between">
                      <div>
                        <h2 className="font-display text-xl text-[var(--paper)]">
                          Subscriptions
                        </h2>
                        <p className="text-[11px] text-[var(--muted)] mt-0.5">
                          Tiers and unlock requests
                        </p>
                      </div>
                      <Link
                        href="/admin/subscriptions"
                        className="text-xs text-[var(--brass)] hover:underline"
                      >
                        Manage →
                      </Link>
                    </div>

                    {/* Plan Cards */}
                    <div className="space-y-2.5">
                      {[
                        { key: "FREE", label: "Free Explorer" },
                        { key: "GROWTH", label: "Growth Plan" },
                        { key: "CONNECT", label: "Connect Pro" },
                        { key: "CONQUER", label: "Conquer Global" },
                      ].map((plan) => {
                        const count = data.subscriptionsByPlan?.[plan.key] || 0;
                        return (
                          <div
                            key={plan.key}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--ink)] border border-[var(--brass)]/10 text-xs"
                          >
                            <span className="text-[var(--paper)]">{plan.label}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                PLAN_BADGES[plan.key] || "border-slate-500"
                              }`}
                            >
                              {count} accounts
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Unlock Status Breakdown */}
                  <div className="mt-6 pt-4 border-t border-[var(--brass)]/15">
                    <h3 className="text-xs text-[var(--muted)] uppercase tracking-wider mb-2">
                      Unlock Requests Activity
                    </h3>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-[var(--ink)] p-2 rounded border border-[var(--brass)]/10">
                        <span className="text-[10px] text-emerald-400 block">GRANTED</span>
                        <strong className="text-sm text-[var(--paper)]">
                          {data.unlocksByStatus?.GRANTED || 0}
                        </strong>
                      </div>
                      <div className="bg-[var(--ink)] p-2 rounded border border-[var(--brass)]/10">
                        <span className="text-[10px] text-amber-400 block">PENDING</span>
                        <strong className="text-sm text-[var(--paper)]">
                          {data.unlocksByStatus?.PENDING || 0}
                        </strong>
                      </div>
                      <div className="bg-[var(--ink)] p-2 rounded border border-[var(--brass)]/10">
                        <span className="text-[10px] text-rose-400 block">DENIED</span>
                        <strong className="text-sm text-[var(--paper)]">
                          {data.unlocksByStatus?.DENIED || 0}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: API Observability & Platform Telemetry */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* API Observability */}
                <div className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 shadow-md">
                  <div className="border-b border-[var(--brass)]/15 pb-4 mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-xl text-[var(--paper)]">
                        API Gateway Telemetry
                      </h2>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5">
                        In-memory endpoint traffic &amp; rate limit enforcement.
                      </p>
                    </div>
                    <span className="rounded bg-emerald-950 border border-emerald-500/50 px-2.5 py-1 text-[10px] text-emerald-300 font-bold">
                      ● Active Tracer
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs mb-4">
                    <div className="bg-[var(--ink)] p-3 rounded-lg border border-[var(--brass)]/10">
                      <span className="text-[10px] text-[var(--muted)] uppercase block">Total Calls</span>
                      <strong className="text-lg text-[var(--paper)]">{data.api?.requests || 0}</strong>
                    </div>
                    <div className="bg-[var(--ink)] p-3 rounded-lg border border-[var(--brass)]/10">
                      <span className="text-[10px] text-[var(--muted)] uppercase block">Avg Latency</span>
                      <strong className="text-lg text-[var(--brass)]">
                        {data.api?.avgResponseTimeMs || 0} ms
                      </strong>
                    </div>
                    <div className="bg-[var(--ink)] p-3 rounded-lg border border-[var(--brass)]/10">
                      <span className="text-[10px] text-[var(--muted)] uppercase block">Rate Limits</span>
                      <strong className="text-lg text-amber-400">
                        {data.api?.rateLimitEvents || 0}
                      </strong>
                    </div>
                    <div className="bg-[var(--ink)] p-3 rounded-lg border border-[var(--brass)]/10">
                      <span className="text-[10px] text-[var(--muted)] uppercase block">Errors</span>
                      <strong className="text-lg text-rose-400">{data.api?.errors || 0}</strong>
                    </div>
                  </div>

                  <div className="rounded-lg bg-[var(--ink)] p-3 border border-[var(--brass)]/10 text-xs">
                    <span className="text-[10px] text-[var(--muted)] uppercase block mb-2">
                      HTTP Status Code Distribution
                    </span>
                    {data.api?.statuses && Object.keys(data.api.statuses).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(data.api.statuses).map(([code, count]) => {
                          const isOk = code.startsWith("2");
                          const isWarn = code.startsWith("4");
                          const isErr = code.startsWith("5");
                          return (
                            <span
                              key={code}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                isOk
                                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                                  : isWarn
                                  ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                                  : isErr
                                  ? "bg-rose-950/60 text-rose-300 border-rose-500/40"
                                  : "bg-slate-900 text-slate-300 border-slate-700"
                              }`}
                            >
                              HTTP {code}: {count}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-[var(--muted)] text-[11px]">
                        No HTTP requests recorded in memory during this runtime session yet.
                      </span>
                    )}
                  </div>
                </div>

                {/* Automated Monitoring & Alerts Platform Health */}
                <div className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 shadow-md">
                  <div className="border-b border-[var(--brass)]/15 pb-4 mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-xl text-[var(--paper)]">
                        Automated Engine Activity
                      </h2>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5">
                        Market monitors, notification dispatch, and saved plans.
                      </p>
                    </div>
                    <Link
                      href="/alerts"
                      className="text-xs text-[var(--brass)] hover:underline"
                    >
                      Alerts →
                    </Link>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--ink)] border border-[var(--brass)]/10">
                      <div>
                        <span className="text-[var(--paper)] font-bold block">Market Alerts</span>
                        <span className="text-[10px] text-[var(--muted)]">
                          {data.alerts?.active || 0} active · {data.alerts?.triggered || 0} triggered
                        </span>
                      </div>
                      <span className="font-display text-lg text-[var(--brass)]">
                        {data.alerts?.total || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--ink)] border border-[var(--brass)]/10">
                      <div>
                        <span className="text-[var(--paper)] font-bold block">System Notifications</span>
                        <span className="text-[10px] text-[var(--muted)]">
                          {data.notifications?.unread || 0} unread across accounts
                        </span>
                      </div>
                      <span className="font-display text-lg text-emerald-400">
                        {data.notifications?.total || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--ink)] border border-[var(--brass)]/10">
                      <div>
                        <span className="text-[var(--paper)] font-bold block">Saved Export Plans</span>
                        <span className="text-[10px] text-[var(--muted)]">
                          Full scenario assessments stored
                        </span>
                      </div>
                      <span className="font-display text-lg text-[var(--paper)]">
                        {data.savedExportPlans || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--ink)] border border-[var(--brass)]/10">
                      <div>
                        <span className="text-[var(--paper)] font-bold block">Market Intelligence Analyses</span>
                        <span className="text-[10px] text-[var(--muted)]">
                          Opportunity score snapshots
                        </span>
                      </div>
                      <span className="font-display text-lg text-[var(--paper)]">
                        {data.savedAnalyses || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Footer */}
              <div className="pt-4 border-t border-[var(--brass)]/20 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--muted)]">Admin Hub:</span>
                  <Link href="/admin" className="text-[var(--brass)] hover:underline">
                    Console Home
                  </Link>
                  <span className="text-[var(--brass)]/40">·</span>
                  <Link href="/admin/users" className="text-[var(--brass)] hover:underline">
                    Users
                  </Link>
                  <span className="text-[var(--brass)]/40">·</span>
                  <Link href="/admin/leads" className="text-[var(--brass)] hover:underline">
                    Leads
                  </Link>
                  <span className="text-[var(--brass)]/40">·</span>
                  <Link href="/admin/subscriptions" className="text-[var(--brass)] hover:underline">
                    Subscriptions
                  </Link>
                </div>
                <div className="text-[10px] text-[var(--muted)]">
                  Data updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </AuthGuard>
  );
}
