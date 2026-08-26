"use client";

import { useState, useMemo } from "react";
import FieldLabel from "../../components/FieldLabel";
import Link from "next/link";
import AuthGuard from "../../components/AuthGuard";
import { HS_SECTIONS, HS_CHAPTERS } from "../../data/tradeData";

export default function HsCodesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");

  // Duty Calculator State
  const [cifValue, setCifValue] = useState(10000);
  const [bcdRate, setBcdRate] = useState(10);
  const [igstRate, setIgstRate] = useState(18);
  const [swsRate, setSwsRate] = useState(10); // Social Welfare Surcharge on BCD

  // Calculator logic
  const calculatedBcd = (cifValue * bcdRate) / 100;
  const calculatedSws = (calculatedBcd * swsRate) / 100;
  const valueForIgst = cifValue + calculatedBcd + calculatedSws;
  const calculatedIgst = (valueForIgst * igstRate) / 100;
  const totalCustomsDuty = calculatedBcd + calculatedSws + calculatedIgst;
  const totalLandedCost = cifValue + totalCustomsDuty;

  // Filtered chapters
  const filteredChapters = useMemo(() => {
    return HS_CHAPTERS.filter((ch) => {
      const matchSection = selectedSection === "all" || ch.section === selectedSection;
      const matchSearch =
        !searchQuery ||
        ch.chapter.includes(searchQuery) ||
        ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.topCodes.some((code) => code.includes(searchQuery));
      return matchSection && matchSearch;
    });
  }, [searchQuery, selectedSection]);

  return (
    <AuthGuard>
      <main className="min-h-screen">
      {/* Hero Header */}
      <section className="border-b border-[var(--brass)]/20 bg-gradient-to-b from-[var(--ink-2)] to-[var(--ink)] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <FieldLabel>Harmonized System Classification &amp; Tariffs</FieldLabel>
          <h1 className="font-display max-w-3xl text-4xl text-[var(--paper)] md:text-5xl">
            HS Code Chapter Directory &amp; Tariff Lookup
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-[var(--muted)] leading-relaxed md:text-base">
            Explore 99 Harmonized System chapters across 21 Sections. Find 6-digit &amp; 8-digit ITC-HS codes, Basic Customs Duties (BCD), GST rates, and export incentives.
          </p>

          {/* Quick Search */}
          <div className="mt-8 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Chapter (e.g. 09, 10, 62, 84), Product (e.g. Rice, Pepper, Garments) or Subcode (e.g. 090411)..."
                className="w-full rounded-lg border border-[var(--brass)]/40 bg-[var(--ink)] px-4 py-3 pl-11 font-mono text-sm text-[var(--paper)] placeholder:text-[var(--muted)] focus:border-[var(--brass)] focus:outline-none"
              />
              <span className="absolute left-4 top-3.5 text-[var(--brass)]">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-xs text-[var(--muted)] hover:text-[var(--paper)]"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Sections Filter */}
      <section className="border-b border-[var(--brass)]/20 bg-[var(--ink-2)] px-6 py-6 overflow-x-auto">
        <div className="mx-auto max-w-6xl flex items-center gap-2 font-mono text-xs whitespace-nowrap">
          <span className="text-[var(--brass)] font-semibold uppercase mr-2">Filter Section:</span>
          <button
            onClick={() => setSelectedSection("all")}
            className={`rounded-full px-4 py-1.5 transition ${
              selectedSection === "all"
                ? "bg-[var(--brass)] text-[var(--ink)] font-bold"
                : "border border-[var(--brass)]/25 text-[var(--muted)] hover:text-[var(--paper)]"
            }`}
          >
            All 21 Sections (99 Ch.)
          </button>
          {HS_SECTIONS.slice(0, 10).map((sec) => (
            <button
              key={sec.section}
              onClick={() => setSelectedSection(sec.section)}
              className={`rounded-full px-3 py-1.5 transition ${
                selectedSection === sec.section
                  ? "bg-[var(--brass)] text-[var(--ink)] font-bold"
                  : "border border-[var(--brass)]/20 text-[var(--muted)] hover:text-[var(--paper)]"
              }`}
            >
              {sec.icon} Sec {sec.section} ({sec.chapters})
            </button>
          ))}
        </div>
      </section>

      {/* Chapters Grid */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-6 font-mono text-xs text-[var(--muted)]">
            <span>
              Showing <strong className="text-[var(--brass)]">{filteredChapters.length}</strong> Chapters
            </span>
            <span>Click any chapter to discover active global buyers and sellers</span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredChapters.map((ch) => (
              <div
                key={ch.chapter}
                className="flex flex-col justify-between rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)] hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-[var(--ink)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--brass)] border border-[var(--brass)]/30">
                      CHAPTER {ch.chapter}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-[var(--muted)]">
                      Section {ch.section}
                    </span>
                  </div>

                  <h3 className="font-display mt-3 text-xl text-[var(--paper)]">
                    {ch.name}
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-2 rounded bg-[var(--ink)] p-3 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--muted)] uppercase">Customs Duty (BCD)</span>
                      <p className="text-[var(--paper)] font-bold">{ch.bcd}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--muted)] uppercase">Applicable IGST</span>
                      <p className="text-[var(--paper)] font-bold">{ch.igst}</p>
                    </div>
                  </div>

                  {ch.topCodes && (
                    <div className="mt-4">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        Popular 6-digit Subheadings:
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {ch.topCodes.map((code) => (
                          <Link
                            key={code}
                            href={`/trade-data?query=${code}`}
                            className="rounded bg-[var(--ink)] border border-[var(--brass)]/20 px-2 py-0.5 font-mono text-[11px] text-[var(--brass)] hover:border-[var(--brass)]"
                          >
                            HS {code}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t border-[var(--brass)]/15 pt-4">
                  <Link
                    href={`/trade-data?query=${ch.chapter}`}
                    className="flex items-center justify-between font-mono text-xs text-[var(--brass)] hover:text-[var(--paper)]"
                  >
                    <span>View Buyers in Ch. {ch.chapter}</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built-in Tariff & Landed Cost Calculator */}
      <section className="border-t border-[var(--brass)]/20 bg-[var(--ink-2)] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <FieldLabel>Interactive EXIM Tool</FieldLabel>
          <h2 className="font-display text-3xl text-[var(--paper)] md:text-4xl">
            Customs Duty &amp; Landed Cost Calculator
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)] max-w-2xl">
            Quickly estimate customs duty, Social Welfare Surcharge (SWS), and IGST on imported goods under Indian and international tariff schedules.
          </p>

          <div className="mt-8 grid gap-8 md:grid-cols-12 rounded-xl border border-[var(--brass)]/30 bg-[var(--ink)] p-6 md:p-8">
            {/* Inputs */}
            <div className="space-y-4 md:col-span-6 font-mono text-xs">
              <div>
                <label className="block text-[var(--brass)] uppercase tracking-wider mb-1">
                  Assessable CIF Value (USD / INR)
                </label>
                <input
                  type="number"
                  value={cifValue}
                  onChange={(e) => setCifValue(Number(e.target.value) || 0)}
                  className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3.5 py-2.5 text-sm text-[var(--paper)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[var(--muted)] uppercase mb-1">BCD Rate (%)</label>
                  <input
                    type="number"
                    value={bcdRate}
                    onChange={(e) => setBcdRate(Number(e.target.value) || 0)}
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3 py-2 text-xs text-[var(--paper)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] uppercase mb-1">SWS Rate (%)</label>
                  <input
                    type="number"
                    value={swsRate}
                    onChange={(e) => setSwsRate(Number(e.target.value) || 0)}
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3 py-2 text-xs text-[var(--paper)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] uppercase mb-1">IGST Rate (%)</label>
                  <input
                    type="number"
                    value={igstRate}
                    onChange={(e) => setIgstRate(Number(e.target.value) || 0)}
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3 py-2 text-xs text-[var(--paper)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Output breakdown */}
            <div className="rounded-lg bg-[var(--ink-2)] p-6 border border-[var(--brass)]/25 md:col-span-6 font-mono text-xs space-y-3">
              <h4 className="text-[var(--brass)] uppercase font-bold tracking-wider border-b border-[var(--brass)]/20 pb-2">
                Customs Duty Breakdown
              </h4>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Base CIF Value:</span>
                <span className="text-[var(--paper)]">${cifValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Basic Customs Duty ({bcdRate}%):</span>
                <span className="text-[var(--paper)]">${calculatedBcd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Social Welfare Surcharge ({swsRate}% on BCD):</span>
                <span className="text-[var(--paper)]">${calculatedSws.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>IGST ({igstRate}% on Assessable Sum):</span>
                <span className="text-[var(--paper)]">${calculatedIgst.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--brass)]/30 pt-2 font-bold text-sm text-[var(--brass)]">
                <span>Total Customs Duty:</span>
                <span>${totalCustomsDuty.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--brass)]/30 pt-2 font-bold text-base text-emerald-400">
                <span>Total Estimated Landed Cost:</span>
                <span>${totalLandedCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </AuthGuard>
);
}
