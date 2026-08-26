"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HS_CHAPTERS } from "../data/tradeData";

export default function EximSearch({ defaultType = "buyers", showTitle = true }) {
  const [activeTab, setActiveTab] = useState(defaultType); // "buyers" | "sellers"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedChapter, setSelectedChapter] = useState("all");
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactFormSubmitted, setContactFormSubmitted] = useState(false);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 4, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Countries are derived from database results. The static chapter list is
  // retained only to provide readable labels for the existing filter UI.
  const countries = useMemo(() => {
    return [...new Set(results.map((item) => item.country).filter(Boolean))].sort();
  }, [results]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: String(pagination.page), limit: String(pagination.limit) });
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (selectedCountry !== "all") params.set("country", selectedCountry);
      if (selectedChapter !== "all") params.set("hsChapter", selectedChapter);

      try {
        const endpoint = activeTab === "buyers" ? "/api/buyers" : "/api/suppliers";
        const response = await fetch(`${endpoint}?${params.toString()}`, {
          credentials: "include",
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load trade records");
        setResults(payload.data || []);
        setPagination((current) => ({ ...current, ...(payload.pagination || {}) }));
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setResults([]);
          setError(requestError.message || "Unable to load trade records");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [activeTab, searchQuery, selectedCountry, selectedChapter, pagination.page, pagination.limit, refreshKey]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCountry("all");
    setSelectedChapter("all");
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const switchType = (type) => {
    setActiveTab(type);
    setSelectedCountry("all");
    setPagination((current) => ({ ...current, page: 1 }));
  };

  return (
    <div className="w-full">
      {showTitle && (
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brass)]/40 bg-[var(--brass)]/10 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.15em] text-[var(--brass)]">
            AI EXIM Intelligence Engine
          </span>
          <h2 className="font-display mt-3 text-3xl text-[var(--paper)] md:text-4xl">
            Search 23Mn+ Verified Buyers &amp; Suppliers Worldwide
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Real-time customs shipment records, bill of lading analytics, and verified B2B contacts across 181+ countries.
          </p>
        </div>
      )}

      {/* Main Search Panel */}
      <div className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-2xl backdrop-blur-sm md:p-8">
        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--brass)]/20 pb-5">
          <div className="flex rounded-lg bg-[var(--ink)] p-1">
            <button
              onClick={() => switchType("buyers")}
              className={`flex items-center gap-2 rounded-md px-6 py-2.5 font-mono text-xs uppercase tracking-[0.12em] transition ${
                activeTab === "buyers"
                  ? "bg-[var(--brass)] font-semibold text-[var(--ink)] shadow-md"
                  : "text-[var(--muted)] hover:text-[var(--paper)]"
              }`}
            >
              <span>🌍</span> Find Foreign Buyers
            </button>
            <button
              onClick={() => switchType("sellers")}
              className={`flex items-center gap-2 rounded-md px-6 py-2.5 font-mono text-xs uppercase tracking-[0.12em] transition ${
                activeTab === "sellers"
                  ? "bg-[var(--brass)] font-semibold text-[var(--ink)] shadow-md"
                  : "text-[var(--muted)] hover:text-[var(--paper)]"
              }`}
            >
              <span>🚢</span> Find Verified Suppliers
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-[var(--muted)]">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            181+ Countries Active · 2026 Customs Records Loaded
          </div>
        </div>

        {/* Search Inputs Bar */}
        <div className="mt-6 grid gap-3 md:grid-cols-12">
          {/* Main search bar */}
          <div className="relative md:col-span-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination((current) => ({ ...current, page: 1 }));
              }}
              placeholder="Search by Product (e.g. Rice, Pepper, Shirt, Valves) or HS Code (e.g. 090411)..."
              className="w-full rounded-lg border border-[var(--brass)]/30 bg-[var(--ink)] px-4 py-3 pl-11 font-mono text-sm text-[var(--paper)] placeholder:text-[var(--muted)]/60 focus:border-[var(--brass)] focus:outline-none"
            />
            <span className="absolute left-4 top-3.5 text-[var(--brass)]">🔍</span>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setPagination((current) => ({ ...current, page: 1 }));
                }}
                className="absolute right-3 top-3 text-xs text-[var(--muted)] hover:text-[var(--paper)]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Country filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setPagination((current) => ({ ...current, page: 1 }));
              }}
              aria-label="Filter by Country"
              className="w-full rounded-lg border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-3 font-mono text-xs text-[var(--paper)] focus:border-[var(--brass)] focus:outline-none"
            >
              <option value="all">🌐 All Countries (181+)</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* HS Chapter filter */}
          <div className="md:col-span-3">
            <select
              value={selectedChapter}
              onChange={(e) => {
                setSelectedChapter(e.target.value);
                setPagination((current) => ({ ...current, page: 1 }));
              }}
              aria-label="Filter by HS Chapter"
              className="w-full rounded-lg border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-3 font-mono text-xs text-[var(--paper)] focus:border-[var(--brass)] focus:outline-none"
            >
              <option value="all">📂 All HS Chapters</option>
              {HS_CHAPTERS.slice(0, 18).map((ch) => (
                <option key={ch.chapter} value={ch.chapter}>
                  Ch. {ch.chapter} — {ch.name.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick sample chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs text-[var(--muted)]">
          <span className="text-[11px] uppercase tracking-wider text-[var(--brass)]">Popular EXIM Searches:</span>
          {["090411 (Spices)", "100630 (Basmati Rice)", "620520 (Apparel)", "841370 (Machinery)", "Chickpeas", "Organic Cotton"].map((tag) => {
            const cleanTag = tag.split(" ")[0].replace("(", "");
            return (
              <button
                key={tag}
                onClick={() => {
                  setSearchQuery(cleanTag);
                  setPagination((current) => ({ ...current, page: 1 }));
                }}
                className="rounded border border-[var(--brass)]/25 bg-[var(--ink)] px-2.5 py-1 text-[11px] text-[var(--paper)] transition hover:border-[var(--brass)] hover:text-[var(--brass)]"
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Live Count Counter Strip */}
        <div className="mt-6 flex flex-wrap items-center justify-between rounded-lg bg-[var(--ink)] px-5 py-3 border border-[var(--brass)]/15 font-mono text-xs">
          <div className="text-[var(--paper)]">
            {loading ? "Loading" : "Showing"} <strong className="text-[var(--brass)]">{loading ? "…" : pagination.total}</strong> verified {activeTab} matches
            {searchQuery && <span> for &ldquo;<span className="text-[var(--paper)]">{searchQuery}</span>&rdquo;</span>}
          </div>
          <div className="text-[var(--muted)]">
            Customs verified data updated daily · Port &amp; Freight records included
          </div>
        </div>

        {/* Results Grid */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {loading ? (
            <div className="col-span-2 rounded-lg border border-[var(--brass)]/20 p-12 text-center font-mono text-xs text-[var(--muted)]">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--brass)] border-t-transparent mr-2 align-middle" />
              Loading verified trade records…
            </div>
          ) : error ? (
            <div className="col-span-2 rounded-lg border border-red-500/40 bg-red-950/20 p-8 text-center">
              <p className="font-display text-lg text-red-200">Trade records could not be loaded</p>
              <p className="mt-2 font-mono text-xs text-red-300">{error}</p>
              <button onClick={() => setRefreshKey((current) => current + 1)} className="mt-4 rounded border border-[var(--brass)]/50 px-4 py-2 font-mono text-xs text-[var(--brass)]">Try Again</button>
            </div>
          ) : results.length === 0 ? (
            <div className="col-span-2 rounded-lg border border-dashed border-[var(--brass)]/30 p-12 text-center">
              <p className="font-display text-lg text-[var(--paper)]">No trade records found for &ldquo;{searchQuery}&rdquo;</p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Try searching for broader keywords like <strong>Rice, Spices, Cotton, Machinery, Valves</strong> or clear filters.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 rounded bg-[var(--brass)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--ink)]"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            results.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-lg border border-[var(--brass)]/20 bg-[var(--ink)]/90 p-5 transition hover:border-[var(--brass)] hover:shadow-lg hover:shadow-[var(--brass)]/5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🌐</span>
                        <h3 className="font-display text-lg text-[var(--paper)] group-hover:text-[var(--brass)] transition">
                          {item.companyName}
                        </h3>
                      </div>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
                        📍 {item.city ? `${item.city}, ` : ""}{item.country} · ID: {item.id}
                      </p>
                    </div>

                    <span className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${item.verified ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-400" : "border-[var(--brass)]/30 bg-[var(--ink-2)] text-[var(--muted)]"}`}>
                      {item.verified ? "✓ Verified Entity" : "Unverified"}
                    </span>
                  </div>

                  <div className="mt-4 rounded bg-[var(--ink-2)]/80 p-3 border border-[var(--brass)]/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[var(--brass)] font-semibold">
                        HS {item.hsCode}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--muted)]">
                        HS Chapter {item.hsChapter || "—"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-[var(--paper)] line-clamp-2">
                      {item.product}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="rounded bg-[var(--ink-2)]/40 p-2">
                      <span className="text-[10px] uppercase text-[var(--muted)]">
                        {activeTab === "buyers" ? "Annual Volume" : "Capacity"}
                      </span>
                      <p className="mt-0.5 font-semibold text-[var(--paper)]">
                        {item.importVolume || item.exportVolume || "Not disclosed"}
                      </p>
                    </div>
                    <div className="rounded bg-[var(--ink-2)]/40 p-2">
                      <span className="text-[10px] uppercase text-[var(--muted)]">
                        {activeTab === "buyers" ? "Est. Trade Value" : "Key Export Port"}
                      </span>
                      <p className="mt-0.5 font-semibold text-[var(--brass)]">
                        {item.city || "Location not disclosed"}
                      </p>
                    </div>
                  </div>

                  {item.buyersNexus && (
                    <div className="mt-3">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        Nexus Supply Chain Nodes:
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {item.buyersNexus.map((node) => (
                          <span
                            key={node}
                            className="rounded bg-[var(--brass)]/10 border border-[var(--brass)]/20 px-2 py-0.5 font-mono text-[10px] text-[var(--paper)]"
                          >
                            🔗 {node}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.certifications && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.certifications.map((c) => (
                        <span
                          key={c}
                          className="rounded bg-sky-950/60 border border-sky-400/30 px-2 py-0.5 font-mono text-[10px] text-sky-300"
                        >
                          🎖️ {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[var(--brass)]/15 pt-4">
                  <button
                    onClick={() => {
                      setSelectedEntity(item);
                      setContactModalOpen(true);
                    }}
                    className="rounded bg-[var(--brass)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--ink)] font-medium transition hover:brightness-110"
                  >
                    Unlock Contacts
                  </button>

                  <Link
                    href={`/trade-data?query=${item.hsCode}`}
                    className="font-mono text-xs text-[var(--brass)] underline underline-offset-4 hover:text-[var(--paper)]"
                  >
                    View Shipment History →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && !error && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4 font-mono text-xs">
            <button type="button" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))} className="rounded border border-[var(--brass)]/35 px-4 py-2 text-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-40 hover:border-[var(--brass)]">
              ← Previous
            </button>
            <span className="text-[var(--muted)]">Page {pagination.page} of {pagination.totalPages}</span>
            <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))} className="rounded border border-[var(--brass)]/35 px-4 py-2 text-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-40 hover:border-[var(--brass)]">
              Next →
            </button>
          </div>
        )}

        {/* Bottom Banner */}
        <div className="mt-8 rounded-lg bg-gradient-to-r from-[var(--ink)] to-[var(--ink-2)] border border-[var(--brass)]/30 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-display text-lg text-[var(--paper)]">
              Need custom trade data feeds or direct phone/email access?
            </h4>
            <p className="text-xs text-[var(--muted)] mt-1">
              Access full Bill of Lading records, Director information, and automated buyer alerts across 181+ countries.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/plans-pricing"
              className="whitespace-nowrap rounded border border-[var(--brass)] px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-[var(--brass)] transition hover:bg-[var(--brass)] hover:text-[var(--ink)]"
            >
              View Pricing Plans
            </Link>
            <Link
              href="/book-a-demo"
              className="whitespace-nowrap rounded bg-[var(--brass)] px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-[var(--ink)] font-semibold transition hover:brightness-110"
            >
              Book Live Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Unlock Contact / Lead Modal */}
      {contactModalOpen && selectedEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-[var(--brass)]/40 bg-[var(--ink)] p-6 shadow-2xl">
            <button
              onClick={() => {
                setContactModalOpen(false);
                setContactFormSubmitted(false);
              }}
              className="absolute right-4 top-4 font-mono text-sm text-[var(--muted)] hover:text-[var(--paper)]"
            >
              ✕ Close
            </button>

            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--brass)]">
              Verified Entity Intel Dossier
            </span>
            <h3 className="font-display mt-1 text-2xl text-[var(--paper)]">
              {selectedEntity.companyName}
            </h3>
            <p className="font-mono text-xs text-[var(--muted)]">
              📍 {selectedEntity.city}, {selectedEntity.country} · HS Code: {selectedEntity.hsCode}
            </p>

            {contactFormSubmitted ? (
              <div className="mt-6 rounded-lg bg-emerald-950/60 border border-emerald-500/40 p-6 text-center">
                <p className="text-2xl">✅</p>
                <h4 className="font-display mt-2 text-lg text-emerald-300">Contact Access Request Sent!</h4>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Our EXIM specialist is generating your instant company dossier containing verified phone, email, and procurement directors for <strong>{selectedEntity.companyName}</strong>. Check your inbox in 2 minutes.
                </p>
                <button
                  onClick={() => setContactModalOpen(false)}
                  className="mt-5 rounded bg-[var(--brass)] px-5 py-2 font-mono text-xs uppercase tracking-wider text-[var(--ink)]"
                >
                  Return to Search
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setContactFormSubmitted(true);
                }}
                className="mt-6 space-y-4"
              >
                <div className="rounded-lg bg-[var(--ink-2)] p-4 border border-[var(--brass)]/20 text-xs font-mono space-y-1 text-[var(--muted)]">
                  <div className="flex justify-between">
                    <span>Direct Personnel Contacts:</span>
                    <span className="text-[var(--brass)]">Procurement Head, MD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recent Port of Discharge:</span>
                    <span className="text-[var(--paper)]">{selectedEntity.city || "Not disclosed"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual Turnover / Trade Volume:</span>
                    <span className="text-[var(--paper)]">{selectedEntity.importVolume || selectedEntity.exportVolume || "Not disclosed"}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    Your Full Name &amp; Company
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Rao - Global Exporters Ltd"
                    className="mt-1 w-full rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3.5 py-2.5 font-mono text-xs text-[var(--paper)] focus:border-[var(--brass)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    Work Email (To receive dossier)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    className="mt-1 w-full rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3.5 py-2.5 font-mono text-xs text-[var(--paper)] focus:border-[var(--brass)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    Mobile / WhatsApp (With country code)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    className="mt-1 w-full rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3.5 py-2.5 font-mono text-xs text-[var(--paper)] focus:border-[var(--brass)] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded bg-[var(--brass)] py-3 font-mono text-xs uppercase tracking-widest text-[var(--ink)] font-bold transition hover:brightness-110"
                >
                  Instant Unlock Verified Contact Dossier
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
