"use client";

import { useState } from "react";
import FieldLabel from "../../components/FieldLabel";
import Link from "next/link";
import AuthGuard from "../../components/AuthGuard";

const SECTOR_TRENDS = [
  { name: "Agricultural & Processed Foods", hs: "Ch 06-24", growth: "+14.2%", volume: "$53.2B", topBuyer: "UAE, Saudi Arabia, USA", status: "High Growth" },
  { name: "Textiles, Apparels & Handlooms", hs: "Ch 50-63", growth: "+8.9%", volume: "$38.6B", topBuyer: "USA, Germany, UK", status: "Steady" },
  { name: "Chemicals, APIs & Pharmaceuticals", hs: "Ch 28-38", growth: "+16.8%", volume: "$44.1B", topBuyer: "USA, Netherlands, Brazil", status: "High Growth" },
  { name: "Engineering Machinery & Electrical", hs: "Ch 84-85", growth: "+19.4%", volume: "$112.5B", topBuyer: "USA, UAE, Singapore", status: "Booming" },
  { name: "Gems, Jewellery & Natural Pearls", hs: "Ch 71", growth: "+6.1%", volume: "$39.8B", topBuyer: "Hong Kong, UAE, USA", status: "Stable" },
  { name: "Ceramics, Tiles & Glassware", hs: "Ch 68-70", growth: "+22.3%", volume: "$14.7B", topBuyer: "Saudi Arabia, Iraq, Mexico", status: "Booming" }
];

const PORT_INDEX = [
  { port: "JNPT / Nhava Sheva (India)", code: "INNSA", avgTurnaround: "18.4 hrs", dwellTime: "1.2 days", congestion: "Low", statusColor: "text-emerald-400" },
  { port: "Mundra Port (India)", code: "INMUN", avgTurnaround: "14.2 hrs", dwellTime: "0.9 days", congestion: "Optimal", statusColor: "text-emerald-400" },
  { port: "Jebel Ali Port (UAE)", code: "AEJEA", avgTurnaround: "16.1 hrs", dwellTime: "1.1 days", congestion: "Normal", statusColor: "text-emerald-400" },
  { port: "Port of Singapore (PSA)", code: "SGSIN", avgTurnaround: "22.5 hrs", dwellTime: "1.8 days", congestion: "Moderate", statusColor: "text-amber-400" },
  { port: "Port of Rotterdam (Netherlands)", code: "NLRTM", avgTurnaround: "26.0 hrs", dwellTime: "2.1 days", congestion: "Moderate", statusColor: "text-amber-400" },
  { port: "Port of Long Beach (USA)", code: "USLGB", avgTurnaround: "34.2 hrs", dwellTime: "3.2 days", congestion: "Heavy", statusColor: "text-rose-400" }
];

export default function MarketAnalysisPage() {
  const [selectedYear, setSelectedYear] = useState("2026");
  const [trendMode, setTrendMode] = useState("export"); // "export" | "import"

  return (
    <AuthGuard>
      <main className="min-h-screen">
      {/* Hero Banner */}
      <section className="border-b border-[var(--brass)]/20 bg-gradient-to-b from-[var(--ink-2)] to-[var(--ink)] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <FieldLabel>Global Trade Analytics &amp; World Market Trends</FieldLabel>
          <h1 className="font-display max-w-4xl text-4xl text-[var(--paper)] md:text-6xl">
            World Market Analysis &amp; Commodity Trends
          </h1>
          <p className="mt-4 max-w-2xl text-base text-[var(--muted)] leading-relaxed md:text-lg">
            Track shifts in international supply-demand dynamics, price volatility indices, tariff advantages, and port dwell times across 181 countries.
          </p>

          {/* Interactive Year & Mode Controls */}
          <div className="mt-8 flex flex-wrap items-center gap-4 font-mono text-xs">
            <div className="flex rounded-lg border border-[var(--brass)]/30 bg-[var(--ink)] p-1">
              <button
                onClick={() => setTrendMode("export")}
                className={`rounded px-4 py-2 transition ${
                  trendMode === "export"
                    ? "bg-[var(--brass)] text-[var(--ink)] font-bold shadow"
                    : "text-[var(--muted)] hover:text-[var(--paper)]"
                }`}
              >
                🚢 Export Growth Outflows
              </button>
              <button
                onClick={() => setTrendMode("import")}
                className={`rounded px-4 py-2 transition ${
                  trendMode === "import"
                    ? "bg-[var(--brass)] text-[var(--ink)] font-bold shadow"
                    : "text-[var(--muted)] hover:text-[var(--paper)]"
                }`}
              >
                📥 Import Demand Inflows
              </button>
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              aria-label="Filter by Year"
              className="rounded-lg border border-[var(--brass)]/30 bg-[var(--ink)] px-4 py-2 text-[var(--paper)] focus:outline-none"
            >
              <option value="2026">Financial Year 2026 (Live Forecast)</option>
              <option value="2025">Financial Year 2025</option>
              <option value="2024">Financial Year 2024</option>
              <option value="2023">Financial Year 2023</option>
            </select>
          </div>
        </div>
      </section>

      {/* Sector Performance Grid */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex justify-between items-end mb-8">
            <div>
              <FieldLabel>Sector Breakdown</FieldLabel>
              <h2 className="font-display text-3xl text-[var(--paper)]">
                Commodity Trends &amp; Export Volume ({selectedYear})
              </h2>
            </div>
            <Link
              href="/trade-data"
              className="font-mono text-xs text-[var(--brass)] underline underline-offset-4 hover:text-[var(--paper)]"
            >
              View Granular HS Codes →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SECTOR_TRENDS.map((sec) => (
              <div
                key={sec.name}
                className="flex flex-col justify-between rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[var(--brass)] font-bold">
                      {sec.hs}
                    </span>
                    <span className="rounded bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                      {sec.growth} YoY
                    </span>
                  </div>

                  <h3 className="font-display mt-3 text-xl text-[var(--paper)]">
                    {sec.name}
                  </h3>

                  <div className="mt-4 rounded bg-[var(--ink)] p-3 font-mono text-xs space-y-1.5">
                    <div className="flex justify-between text-[var(--muted)]">
                      <span>Total Annual Volume:</span>
                      <span className="text-[var(--paper)] font-bold">{sec.volume}</span>
                    </div>
                    <div className="flex justify-between text-[var(--muted)]">
                      <span>Key Destination Markets:</span>
                      <span className="text-[var(--brass)] text-[11px]">{sec.topBuyer}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-[var(--brass)]/15 pt-4">
                  <Link
                    href={`/trade-data?query=${sec.name.split(" ")[0]}`}
                    className="font-mono text-xs text-[var(--brass)] flex items-center justify-between hover:text-[var(--paper)]"
                  >
                    <span>Discover Buyers in this Sector</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Port Intelligence & Turnaround index */}
      <section className="border-t border-[var(--brass)]/20 bg-[var(--ink-2)] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <FieldLabel>Maritime Logistics Intelligence</FieldLabel>
          <h2 className="font-display text-3xl text-[var(--paper)] md:text-4xl">
            Major Port Congestion &amp; Vessel Turnaround Index
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)] max-w-2xl">
            Optimize freight scheduling by choosing ports with minimum container dwell times and reliable vessel turnaround performance.
          </p>

          <div className="mt-8 overflow-x-auto rounded-xl border border-[var(--brass)]/30 bg-[var(--ink)]">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-[var(--brass)]/25 bg-[var(--ink-2)] text-[var(--brass)] uppercase">
                <tr>
                  <th className="p-4">Port Name &amp; UN/LOCODE</th>
                  <th className="p-4">Avg Vessel Turnaround</th>
                  <th className="p-4">Container Dwell Time</th>
                  <th className="p-4">Congestion Status</th>
                  <th className="p-4 text-right">Route Analytics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--brass)]/15 text-[var(--paper)]">
                {PORT_INDEX.map((p) => (
                  <tr key={p.code} className="hover:bg-[var(--ink-2)]/40 transition">
                    <td className="p-4 font-bold">
                      {p.port} <span className="text-[10px] text-[var(--muted)] font-normal">({p.code})</span>
                    </td>
                    <td className="p-4">{p.avgTurnaround}</td>
                    <td className="p-4">{p.dwellTime}</td>
                    <td className="p-4">
                      <span className={`font-bold ${p.statusColor}`}>● {p.congestion}</span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/trade-data?query=${p.code}`}
                        className="text-[var(--brass)] hover:underline"
                      >
                        View Active Carriers →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  </AuthGuard>
);
}
