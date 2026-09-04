"use client";

import { useState, useEffect } from "react";
import FieldLabel from "../../components/FieldLabel";
import EximSearch from "../../components/EximSearch";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";

export default function TradeDataPage() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(true);
  const [shipmentsError, setShipmentsError] = useState(null);

  useEffect(() => {
    if (!user) {
      setShipmentsLoading(false);
      return;
    }

    let cancelled = false;
    fetch("/api/shipments?limit=10&sort=shipmentDate:desc", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          if (!cancelled) setShipmentsError("Please sign in with an active account to view shipments.");
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (!cancelled && json?.data) {
          setShipments(json.data);
        }
      })
      .catch((err) => {
        if (!cancelled) setShipmentsError("Couldn't load the live manifest feed.");
      })
      .finally(() => {
        if (!cancelled) setShipmentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <AuthGuard>
      <main className="min-h-screen">
        {/* Hero Banner */}
        <section className="border-b border-[var(--brass)]/20 bg-gradient-to-b from-[var(--ink-2)] to-[var(--ink)] px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl">
            <FieldLabel>EXIM Intelligence — Global Customs Records</FieldLabel>
            <h1 className="font-display max-w-4xl text-4xl text-[var(--paper)] md:text-6xl">
              Access Verified Global Trade Data from 181+ Countries.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-[var(--muted)] leading-relaxed md:text-lg">
              Make high-conviction decisions with granular Bill of Lading records, customs transaction histories, active supplier-buyer linkages, and price benchmarking.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#search-engine"
                className="rounded bg-[var(--brass)] px-6 py-3 font-mono text-xs uppercase tracking-widest text-[var(--ink)] font-bold transition hover:brightness-110"
              >
                Explore Live Data
              </a>
              <Link
                href="/export-potential-test"
                className="rounded border border-[var(--brass)]/40 px-6 py-3 font-mono text-xs uppercase tracking-widest text-[var(--paper)] transition hover:border-[var(--brass)] hover:text-[var(--brass)]"
              >
                Test Export Potential →
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="mt-12 grid grid-cols-2 gap-4 border-t border-[var(--brass)]/20 pt-8 sm:grid-cols-4 font-mono text-xs">
              <div>
                <p className="text-2xl font-bold text-[var(--brass)]">181+</p>
                <p className="text-[var(--muted)] mt-1 uppercase">Reporting Countries</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--brass)]">23 Mn+</p>
                <p className="text-[var(--muted)] mt-1 uppercase">Verified Company Profiles</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--brass)]">99 Ch.</p>
                <p className="text-[var(--muted)] mt-1 uppercase">Harmonized HS Codes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--brass)]">450+</p>
                <p className="text-[var(--muted)] mt-1 uppercase">Global Ports Tracked</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Search Section */}
        <section id="search-engine" className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <EximSearch defaultType="buyers" showTitle={false} />
          </div>
        </section>

        {/* Recent Shipment Bill of Lading Stream */}
        <section className="bg-[var(--ink-2)] px-6 py-16 border-t border-b border-[var(--brass)]/20">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <FieldLabel>Live Customs Stream — Recent Bills of Lading</FieldLabel>
                <h2 className="font-display text-3xl text-[var(--paper)]">
                  Sample Live Manifest Feed
                </h2>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Real-time transactions recorded across major sea and air ports worldwide.
                </p>
              </div>
              <Link
                href="/plans-pricing"
                className="rounded border border-[var(--brass)] px-4 py-2 font-mono text-xs uppercase tracking-widest text-[var(--brass)] hover:bg-[var(--brass)] hover:text-[var(--ink)]"
              >
                Download Full Manifest Datasets
              </Link>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[var(--brass)]/25 bg-[var(--ink)]">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-[var(--brass)]/20 bg-[var(--ink-2)] text-[var(--brass)] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">BL Number &amp; Date</th>
                    <th className="px-4 py-3.5">Shipper (Exporter)</th>
                    <th className="px-4 py-3.5">Consignee (Buyer)</th>
                    <th className="px-4 py-3.5">HS Code &amp; Goods</th>
                    <th className="px-4 py-3.5">Port of Loading → Discharge</th>
                    <th className="px-4 py-3.5">Declared Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--brass)]/10 text-[var(--paper)]">
                  {shipmentsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-4 py-4">
                          <div className="h-4 w-full animate-pulse rounded bg-[var(--ink-2)]" />
                        </td>
                      </tr>
                    ))
                  ) : shipmentsError ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-red-300">
                        {shipmentsError}
                      </td>
                    </tr>
                  ) : shipments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-[var(--muted)]">
                        No shipment records found.
                      </td>
                    </tr>
                  ) : (
                    shipments.map((s) => (
                      <tr key={s.id} className="hover:bg-[var(--ink-2)]/60 transition">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="font-bold text-[var(--brass)]">SHP-{s.id}</span>
                          <p className="text-[10px] text-[var(--muted)]">
                            {s.shipmentDate ? new Date(s.shipmentDate).toLocaleDateString() : "—"}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-medium">{s.exporter}</span>
                          <p className="text-[10px] text-emerald-400">✓ Audited Supplier</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-medium">{s.importer}</span>
                          <p className="text-[10px] text-sky-400">✓ Verified Buyer</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-bold text-[var(--brass)]">HS {s.hsCode}</span>
                          <p className="text-[11px] text-[var(--muted)] line-clamp-1">{s.product}</p>
                          <p className="text-[10px] text-[var(--muted)]">
                            {s.quantity} {s.unit}
                          </p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p>{s.originPort || s.originCountry}</p>
                          <p className="text-[var(--brass)]">↳ {s.destinationPort || s.destinationCountry}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-bold text-emerald-400">
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
        </section>

        {/* 3 Ways to Explore Trade Data */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <FieldLabel>Data Navigation Strategies</FieldLabel>
            <h2 className="font-display text-3xl text-[var(--paper)] md:text-4xl">
              Three dimensions to explore global commerce
            </h2>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 flex flex-col justify-between">
                <div>
                  <span className="text-3xl">📦</span>
                  <h3 className="font-display text-xl text-[var(--paper)] mt-4">By Product</h3>
                  <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                    Discover untapped niche markets for your product catalog. Benchmark FOB prices, packaging standards, and peak seasonal buying windows.
                  </p>
                </div>
                <Link
                  href="/trade-data?filter=product"
                  className="mt-6 font-mono text-xs text-[var(--brass)] uppercase tracking-wider underline underline-offset-4"
                >
                  Search by Product →
                </Link>
              </div>

              <div className="rounded-lg border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 flex flex-col justify-between">
                <div>
                  <span className="text-3xl">🌐</span>
                  <h3 className="font-display text-xl text-[var(--paper)] mt-4">By Country</h3>
                  <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                    Analyze bilateral trade flows between any two countries. View duty concessions under FTAs, CEPA, and Generalized Tariff Systems.
                  </p>
                </div>
                <Link
                  href="/market-analysis"
                  className="mt-6 font-mono text-xs text-[var(--brass)] uppercase tracking-wider underline underline-offset-4"
                >
                  Analyze Country Flows →
                </Link>
              </div>

              <div className="rounded-lg border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 flex flex-col justify-between">
                <div>
                  <span className="text-3xl">📑</span>
                  <h3 className="font-display text-xl text-[var(--paper)] mt-4">By HSN Codes</h3>
                  <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                    Drill down from 2-digit Chapters to 8-digit ITC-HS tariff classifications. Calculate Basic Customs Duty, IGST, and RoDTEP export incentives.
                  </p>
                </div>
                <Link
                  href="/hs-codes"
                  className="mt-6 font-mono text-xs text-[var(--brass)] uppercase tracking-wider underline underline-offset-4"
                >
                  Browse HS Directory →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
