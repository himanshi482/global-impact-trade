"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FieldLabel from "../../components/FieldLabel";
import EximSearch from "../../components/EximSearch";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("search"); // "search" | "shipments" | "tools"

  const [shipments, setShipments] = useState([]);
  const [shipmentsError, setShipmentsError] = useState(null);
  const [shipmentsStatus, setShipmentsStatus] = useState("idle"); // "idle" | "loading" | "done"

  const [savedAnalyses, setSavedAnalyses] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/market-analysis/saved", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { savedAnalyses: [] }))
      .then((data) => {
        if (!cancelled && data?.savedAnalyses) {
          setSavedAnalyses(data.savedAnalyses.slice(0, 3));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Only hit the API the first time the "shipments" tab is opened.
  useEffect(() => {
    if (activeTab !== "shipments" || shipmentsStatus !== "idle") return;
    let cancelled = false;

    fetch("/api/shipments?limit=10&sort=shipmentDate:desc")
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        setShipments(json.data || []);
        setShipmentsStatus("done");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("GET /api/shipments failed:", err);
        setShipmentsError("Couldn't load shipments right now.");
        setShipmentsStatus("done");
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, shipmentsStatus]);

  const shipmentsLoading = activeTab === "shipments" && shipmentsStatus !== "done";

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gradient-to-b from-[var(--ink-2)] via-[var(--ink)] to-[var(--ink)] px-4 py-8 sm:px-6 md:px-8">
        <div className="mx-auto max-w-7xl">
          
          {/* Top User Greeting & Status Bar */}
          <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 md:p-8 shadow-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--brass)] font-display text-2xl font-bold text-[var(--ink)] shadow-md">
                {user?.name ? user.name.charAt(0) : "G"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl md:text-3xl text-[var(--paper)]">
                    Welcome to EXIM Portal, {user?.name || "Trader"}
                  </h1>
                  <span className="rounded-full bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 font-mono text-[10px] text-emerald-400 font-bold">
                    ● Active Session
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                  🏢 {user?.company || "Global Enterprise"} {user?.iec ? `· IEC: ${user.iec}` : ""} · ✉️ {user?.email || "user@trade.com"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              <div className="rounded-lg bg-[var(--ink)] p-3 border border-[var(--brass)]/20 text-right">
                <span className="text-[10px] uppercase text-[var(--muted)]">Current Plan</span>
                <p className="text-[var(--brass)] font-bold">{user?.plan || "Explorer License"}</p>
              </div>
              <Link
                href="/plans-pricing"
                className="rounded bg-[var(--brass)] px-4 py-3 text-[var(--ink)] font-bold uppercase tracking-wider hover:brightness-110 shadow"
              >
                Upgrade Plan
              </Link>
              <button
                onClick={logout}
                className="rounded border border-[var(--brass)]/30 px-3.5 py-3 text-[var(--muted)] hover:text-[var(--paper)] hover:border-[var(--brass)]"
              >
                Sign Out 🚪
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 font-mono text-xs mb-8">
            <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-4">
              <p className="text-[10px] uppercase text-[var(--muted)]">Available Search Credits</p>
              <p className="font-display text-2xl font-bold text-[var(--brass)] mt-1">Unlimited</p>
              <p className="text-[10px] text-emerald-400 mt-1">✓ 181+ Countries Active</p>
            </div>
            <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-4">
              <p className="text-[10px] uppercase text-[var(--muted)]">Verified Profile Views</p>
              <p className="font-display text-2xl font-bold text-[var(--paper)] mt-1">10 / 10 Left</p>
              <p className="text-[10px] text-[var(--muted)] mt-1">Explorer Trial Allocation</p>
            </div>
            <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-4">
              <p className="text-[10px] uppercase text-[var(--muted)]">Global Shipments Tracked</p>
              <p className="font-display text-2xl font-bold text-[var(--brass)] mt-1">23,410,890</p>
              <p className="text-[10px] text-emerald-400 mt-1">● Real-time Live Feed</p>
            </div>
            <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-4">
              <p className="text-[10px] uppercase text-[var(--muted)]">Trade Specialist Hotline</p>
              <p className="font-display text-lg font-bold text-[var(--paper)] mt-1.5">+91 40 6810 9999</p>
              <p className="text-[10px] text-[var(--brass)] mt-1">24/7 Priority Support</p>
            </div>
          </div>

          {/* Market Opportunities & Saved Analyses Banner */}
          <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-xl mb-8 font-mono text-xs">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
              <div>
                <span className="text-[10px] text-[var(--brass)] font-bold uppercase">Advanced Trade Intelligence</span>
                <h2 className="font-display text-xl text-[var(--paper)] mt-0.5">
                  Market Opportunities &amp; Corridor Dossiers
                </h2>
              </div>
              <Link
                href="/market-analysis"
                className="rounded bg-[var(--brass)] px-4 py-2 font-bold uppercase text-[var(--ink)] hover:brightness-110 shadow transition text-center"
              >
                ⚡ Analyze Market
              </Link>
            </div>

            {savedAnalyses.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                {savedAnalyses.map((sa) => (
                  <Link
                    key={sa.id}
                    href="/market-analysis"
                    className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink)] p-3.5 hover:border-[var(--brass)] transition block group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-[var(--paper)] group-hover:text-[var(--brass)]">
                        {sa.country || "Global"}
                      </span>
                      <span className="rounded bg-emerald-950 border border-emerald-500/40 px-1.5 py-0.2 text-[10px] text-emerald-400 font-bold">
                        {sa.opportunityScore}/100
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--muted)] mt-1">
                      HS Code: {sa.hsCode || "General"} · {sa.direction || "export"}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[var(--muted)] text-[11px]">
                Explore top global destination markets, compute deterministic opportunity scores, and benchmark customs manifest trade velocity in the Market Analysis suite.
              </p>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex rounded-xl bg-[var(--ink-2)] p-1.5 border border-[var(--brass)]/20 mb-8 font-mono text-xs">
            <button
              onClick={() => setActiveTab("search")}
              className={`flex-1 rounded-lg py-3 uppercase tracking-wider transition ${
                activeTab === "search"
                  ? "bg-[var(--brass)] text-[var(--ink)] font-bold shadow-md"
                  : "text-[var(--muted)] hover:text-[var(--paper)]"
              }`}
            >
              🔍 Buyer &amp; Supplier Discovery
            </button>
            <button
              onClick={() => setActiveTab("shipments")}
              className={`flex-1 rounded-lg py-3 uppercase tracking-wider transition ${
                activeTab === "shipments"
                  ? "bg-[var(--brass)] text-[var(--ink)] font-bold shadow-md"
                  : "text-[var(--muted)] hover:text-[var(--paper)]"
              }`}
            >
              🚢 Customs Shipment Manifests
            </button>
            <button
              onClick={() => setActiveTab("tools")}
              className={`flex-1 rounded-lg py-3 uppercase tracking-wider transition ${
                activeTab === "tools"
                  ? "bg-[var(--brass)] text-[var(--ink)] font-bold shadow-md"
                  : "text-[var(--muted)] hover:text-[var(--paper)]"
              }`}
            >
              ⚙️ All EXIM Intelligence Tools
            </button>
          </div>

          {/* Tab 1: Live Buyer / Supplier Search */}
          {activeTab === "search" && (
            <div className="space-y-8">
              <EximSearch defaultType="buyers" showTitle={false} />
            </div>
          )}

          {/* Tab 2: Shipment Manifests Feed */}
          {activeTab === "shipments" && (
            <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 md:p-8 shadow-2xl">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                  <FieldLabel>Live Customs Ingestion Stream</FieldLabel>
                  <h2 className="font-display text-2xl text-[var(--paper)]">
                    Recent Verified Bills of Lading
                  </h2>
                </div>
                <Link
                  href="/trade-data"
                  className="rounded border border-[var(--brass)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--brass)] hover:bg-[var(--brass)] hover:text-[var(--ink)]"
                >
                  Open Full Trade Data Search →
                </Link>
              </div>

              <div className="overflow-x-auto rounded-lg border border-[var(--brass)]/25 bg-[var(--ink)]">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-[var(--brass)]/20 bg-[var(--ink-2)] text-[var(--brass)] uppercase">
                    <tr>
                      <th className="p-4">BL &amp; Date</th>
                      <th className="p-4">Shipper</th>
                      <th className="p-4">Consignee</th>
                      <th className="p-4">Product &amp; HS</th>
                      <th className="p-4">Route</th>
                      <th className="p-4">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--brass)]/10 text-[var(--paper)]">
                    {shipmentsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={6} className="p-4">
                            <div className="h-4 w-full animate-pulse rounded bg-[var(--ink-2)]" />
                          </td>
                        </tr>
                      ))
                    ) : shipmentsError ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-red-300">
                          {shipmentsError}
                        </td>
                      </tr>
                    ) : shipments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-[var(--muted)]">
                          No shipment records found.
                        </td>
                      </tr>
                    ) : (
                      shipments.map((s) => (
                        <tr key={s.id} className="hover:bg-[var(--ink-2)]/40 transition">
                          <td className="p-4">
                            <span className="font-bold text-[var(--brass)]">SHP-{s.id}</span>
                            <p className="text-[10px] text-[var(--muted)]">
                              {s.shipmentDate ? new Date(s.shipmentDate).toLocaleDateString() : "—"}
                            </p>
                          </td>
                          <td className="p-4">{s.exporter}</td>
                          <td className="p-4 font-semibold text-sky-400">{s.importer}</td>
                          <td className="p-4">
                            <span className="text-[var(--brass)]">HS {s.hsCode}</span>
                            <p className="text-[10px] text-[var(--muted)]">{s.product}</p>
                          </td>
                          <td className="p-4">
                            <p>{s.originPort || s.originCountry}</p>
                            <p className="text-[var(--brass)]">↳ {s.destinationPort || s.destinationCountry}</p>
                          </td>
                          <td className="p-4 font-bold text-emerald-400">
                            {typeof s.shipmentValue === "number"
                              ? `$${s.shipmentValue.toLocaleString()}`
                              : s.shipmentValue}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: All EXIM Intelligence Tools Grid */}
          {activeTab === "tools" && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: "📊",
                  title: "Export Potential Assessment",
                  desc: "Test your product quality, capacity, and statutory export licenses for immediate international onboarding.",
                  link: "/export-potential-test",
                  btn: "Launch Potential Test"
                },
                {
                  icon: "📑",
                  title: "HS Code & Tariff Directory",
                  desc: "Browse 99 Chapters, look up Basic Customs Duty (BCD), SWS, IGST, and compute landed import costs.",
                  link: "/hs-codes",
                  btn: "Open HS Directory"
                },
                {
                  icon: "📈",
                  title: "World Market Analysis & Port Index",
                  desc: "Analyze commodity flow growth, top exporting destinations, and maritime port dwell times.",
                  link: "/market-analysis",
                  btn: "View Market Analytics"
                },
                {
                  icon: "🕸️",
                  title: "Nexus 2.0 Supply Chain Map",
                  desc: "Visualize multi-tier buyer-seller webs, raw material origins, and competitor alternative sourcing.",
                  link: "/features#nexus",
                  btn: "Explore Nexus Map"
                },
                {
                  icon: "📅",
                  title: "1-on-1 Strategy Demo",
                  desc: "Schedule a personalized product walkthrough with our senior foreign trade intelligence specialist.",
                  link: "/book-a-demo",
                  btn: "Schedule Specialist Call"
                },
                {
                  icon: "💳",
                  title: "Plans & Enterprise Pricing",
                  desc: "Unlock bulk raw data downloads, API feeds into your ERP, and unlimited company director contacts.",
                  link: "/plans-pricing",
                  btn: "Manage Subscription"
                }
              ].map((t) => (
                <div
                  key={t.title}
                  className="flex flex-col justify-between rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] shadow-lg"
                >
                  <div>
                    <span className="text-3xl">{t.icon}</span>
                    <h3 className="font-display mt-3 text-xl text-[var(--paper)]">{t.title}</h3>
                    <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{t.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[var(--brass)]/15">
                    <Link
                      href={t.link}
                      className="inline-block w-full rounded bg-[var(--ink)] border border-[var(--brass)]/40 py-2.5 text-center font-mono text-xs uppercase tracking-wider text-[var(--brass)] font-bold hover:bg-[var(--brass)] hover:text-[var(--ink)] transition"
                    >
                      {t.btn} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </AuthGuard>
  );
}
