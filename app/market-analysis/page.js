"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import FieldLabel from "../../components/FieldLabel";
import AuthGuard from "../../components/AuthGuard";

const DEFAULT_HS = "010121";
const DEFAULT_COUNTRY = "United Arab Emirates";

const POPULAR_COUNTRIES = [
  "United Arab Emirates",
  "Germany",
  "United States",
  "Saudi Arabia",
  "United Kingdom",
  "Singapore",
  "Australia",
  "France",
  "Japan",
  "Netherlands",
];

const SECTOR_TRENDS = [
  { name: "Live Horses & Equines", hs: "010121", growth: "+11.4%", volume: "$4.2M", topBuyer: "UAE, Saudi Arabia, Qatar", status: "Active Lead" },
  { name: "Agricultural & Processed Foods", hs: "090411", growth: "+14.2%", volume: "$53.2B", topBuyer: "UAE, Saudi Arabia, USA", status: "High Growth" },
  { name: "Textiles, Apparels & Handlooms", hs: "620520", growth: "+8.9%", volume: "$38.6B", topBuyer: "USA, Germany, UK", status: "Steady" },
  { name: "Chemicals, APIs & Pharmaceuticals", hs: "293339", growth: "+16.8%", volume: "$44.1B", topBuyer: "USA, Netherlands, Brazil", status: "High Growth" },
  { name: "Engineering Machinery & Electrical", hs: "841370", growth: "+19.4%", volume: "$112.5B", topBuyer: "USA, UAE, Singapore", status: "Booming" },
  { name: "Vehicles & Transport Components", hs: "871410", growth: "+12.1%", volume: "$28.4B", topBuyer: "Germany, USA, UAE", status: "Expanding" },
];

export default function MarketAnalysisPage() {
  // Search parameters — HS code is strictly handled as string to preserve leading zeroes
  const [hsCode, setHsCode] = useState(DEFAULT_HS);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [direction, setDirection] = useState("export");
  const [year, setYear] = useState("all");

  // Main analysis state
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Saved analyses state & Save button UX
  const [savedList, setSavedList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Country Comparison state
  const [compareCountries, setCompareCountries] = useState(["United Arab Emirates", "Germany", "United States"]);
  const [newCompareCountry, setNewCompareCountry] = useState("");
  const [comparisonResults, setComparisonResults] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState("");

  // Best Markets Finder state
  const [bestMarkets, setBestMarkets] = useState(null);
  const [loadingBest, setLoadingBest] = useState(false);
  const [bestMarketsError, setBestMarketsError] = useState("");

  // Active sub-tab
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "compare" | "best" | "saved"

  const fetchAnalysis = useCallback(async (targetHs, targetCountry, targetDir, targetYear) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (targetHs && targetHs.trim()) params.set("hsCode", targetHs.trim());
      if (targetCountry && targetCountry.trim()) params.set("country", targetCountry.trim());
      if (targetDir) params.set("direction", targetDir);
      if (targetYear && targetYear !== "all") params.set("year", targetYear);

      const res = await fetch(`/api/market-analysis?${params}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setAnalysis(data);
      } else {
        setError(data.error || "Failed to load market analysis");
      }
    } catch {
      setError("Network error while generating market intelligence");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSavedAnalyses = useCallback(async () => {
    try {
      const res = await fetch("/api/market-analysis/saved", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setSavedList(data.savedAnalyses || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchAnalysis(DEFAULT_HS, DEFAULT_COUNTRY, "export", "all"); // eslint-disable-line react-hooks/set-state-in-effect
    loadSavedAnalyses();
  }, [fetchAnalysis, loadSavedAnalyses]);

  function handleSearch(e) {
    e.preventDefault();
    fetchAnalysis(hsCode, country, direction, year);
    // Reset best markets so user sees up-to-date best markets when switching tabs
    setBestMarkets(null);
  }

  async function handleSaveAnalysis() {
    if (!analysis || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/market-analysis/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          hsCode: hsCode ? hsCode.trim() : analysis.market.hsCode,
          country: country ? country.trim() : analysis.market.country,
          direction: direction || analysis.market.direction,
          filters: { year: year || analysis.market.year },
          opportunityScore: analysis.score?.overall ?? 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveSuccess(true);
        setSuccessMsg("Market analysis saved to your portfolio!");
        await loadSavedAnalyses();
        setTimeout(() => {
          setSaveSuccess(false);
          setSuccessMsg("");
        }, 3000);
      } else {
        setError(data.error || "Saved analysis could not be saved. Please check database setup.");
      }
    } catch {
      setError("Saved analysis could not be saved. Please check database setup.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSaved(id) {
    if (!confirm("Are you sure you want to remove this saved analysis?")) return;
    try {
      const res = await fetch(`/api/market-analysis/saved/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setSavedList((prev) => prev.filter((item) => item.id !== id));
        setSuccessMsg("Saved analysis removed");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete analysis");
      }
    } catch {
      setError("Failed to delete analysis");
    }
  }

  async function handleRerunSaved(id) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/market-analysis/saved/${id}/rerun`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setAnalysis(data.analysis);
        setHsCode(data.savedRecord.hsCode || "");
        setCountry(data.savedRecord.country || "");
        setDirection(data.savedRecord.direction || "export");
        setActiveTab("overview");
        setSuccessMsg("Analysis refreshed with live database metrics!");
        setTimeout(() => setSuccessMsg(""), 3500);
        loadSavedAnalyses();
      } else {
        setError(data.error || "Failed to re-run analysis");
      }
    } catch {
      setError("Failed to re-run analysis");
    } finally {
      setLoading(false);
    }
  }

  async function runCountryComparison() {
    if (compareCountries.length < 2) {
      setCompareError("Please select at least 2 countries to compare.");
      return;
    }
    setComparing(true);
    setCompareError("");
    try {
      const params = new URLSearchParams();
      if (hsCode && hsCode.trim()) params.set("hsCode", hsCode.trim());
      params.set("countries", compareCountries.join(","));

      const res = await fetch(`/api/market-analysis/compare?${params}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setComparisonResults(data.comparisons || []);
      } else {
        setCompareError(data.error || "Comparison failed");
      }
    } catch {
      setCompareError("Network error comparing countries");
    } finally {
      setComparing(false);
    }
  }

  async function runFindBestMarkets() {
    setLoadingBest(true);
    setBestMarketsError("");
    try {
      const params = new URLSearchParams();
      if (hsCode && hsCode.trim()) params.set("hsCode", hsCode.trim());
      const res = await fetch(`/api/market-analysis/best-markets?${params}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setBestMarkets(data.bestMarkets || []);
      } else {
        setBestMarketsError(data.error || "Failed to discover best markets");
      }
    } catch {
      setBestMarketsError("Network error discovering best markets");
    } finally {
      setLoadingBest(false);
    }
  }

  function addCompareCountry() {
    if (!newCompareCountry.trim()) return;
    const c = newCompareCountry.trim();
    if (!compareCountries.includes(c) && compareCountries.length < 5) {
      setCompareCountries([...compareCountries, c]);
      setNewCompareCountry("");
    }
  }

  function removeCompareCountry(c) {
    setCompareCountries(compareCountries.filter((item) => item !== c));
  }

  const m = analysis?.metrics;
  const s = analysis?.score;

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[var(--ink)] py-10 px-4 sm:px-6 md:px-8">
        <div className="mx-auto max-w-7xl">
          
          {/* Header Banner */}
          <div className="border-b border-[var(--brass)]/20 pb-6 mb-8">
            <FieldLabel>Advanced Global Market Intelligence · Phase 1</FieldLabel>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl md:text-4xl text-[var(--paper)]">
                  Commodity Opportunity &amp; Trade Intelligence
                </h1>
                <p className="mt-1 text-xs text-[var(--muted)] font-mono">
                  Deterministic market opportunity scoring, bill of lading manifest analytics, and international trade corridor benchmarking.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveAnalysis}
                  disabled={!analysis || saving || saveSuccess}
                  className="rounded border border-[var(--brass)]/40 bg-[var(--ink-2)] px-4 py-2 font-mono text-xs text-[var(--brass)] hover:bg-[var(--brass)] hover:text-[var(--ink)] font-bold transition disabled:opacity-50"
                  title={!analysis ? "Run market analysis before saving." : ""}
                >
                  {saving ? "Saving…" : saveSuccess ? "✓ Analysis Saved" : "★ Save Analysis"}
                </button>
                <Link
                  href="/trade-data"
                  className="rounded bg-[var(--brass)] px-4 py-2 font-mono text-xs font-bold uppercase text-[var(--ink)] hover:brightness-110 shadow"
                >
                  Trade Data Directory →
                </Link>
              </div>
            </div>
          </div>

          {/* Feedback Toasts */}
          {successMsg && (
            <div className="mb-6 rounded-lg border border-emerald-500/40 bg-emerald-950/60 px-4 py-3 text-xs text-emerald-300 font-mono">
              ✓ {successMsg}
            </div>
          )}
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/40 bg-red-950/60 px-4 py-3 text-xs text-red-300 font-mono">
              ⚠ {error}
            </div>
          )}

          {/* Top Search & Filter Bar */}
          <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-xl mb-8">
            <form onSubmit={handleSearch} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 font-mono text-xs">
              <div>
                <label className="block text-[var(--muted)] uppercase mb-1">Product / HS Code (Digits Only)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={hsCode}
                  onChange={(e) => {
                    // Digits only, preserve leading zeroes, max 8 digits
                    const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                    setHsCode(val);
                  }}
                  placeholder="e.g. 010121, 090411, 871410"
                  className="w-full rounded-lg border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2.5 text-[var(--paper)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--brass)] font-mono"
                />
              </div>

              <div>
                <label className="block text-[var(--muted)] uppercase mb-1">Target Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United Arab Emirates, Germany"
                  className="w-full rounded-lg border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2.5 text-[var(--paper)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--brass)]"
                />
              </div>

              <div>
                <label className="block text-[var(--muted)] uppercase mb-1">Trade Direction</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  className="w-full rounded-lg border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                >
                  <option value="export">🚢 Export Outflows (India → World)</option>
                  <option value="import">📥 Import Inflows (World → India)</option>
                  <option value="all">🌐 All Trade Directions</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--muted)] uppercase mb-1">Historical Period</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-lg border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                >
                  <option value="all">All Available Records</option>
                  <option value="2026">2026 Manifests</option>
                  <option value="2025">2025 Manifests</option>
                  <option value="2024">2024 Manifests</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[var(--brass)] py-2.5 font-bold uppercase text-[var(--ink)] hover:brightness-110 shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-[var(--ink)] border-t-transparent animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    "⚡ Analyze Market"
                  )}
                </button>
              </div>
            </form>

            {/* Quick Country Filters */}
            <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px] pt-3 border-t border-[var(--brass)]/15">
              <span className="text-[var(--muted)]">Quick Markets:</span>
              {POPULAR_COUNTRIES.slice(0, 6).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCountry(c);
                    fetchAnalysis(hsCode, c, direction, year);
                  }}
                  className={`rounded px-2 py-1 transition ${
                    country === c
                      ? "bg-[var(--brass)] text-[var(--ink)] font-bold"
                      : "border border-[var(--brass)]/20 text-[var(--muted)] hover:text-[var(--paper)]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Workbench Mode Tabs */}
          <div className="flex rounded-xl bg-[var(--ink-2)] p-1 border border-[var(--brass)]/20 mb-8 font-mono text-xs">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 rounded-lg py-2.5 uppercase tracking-wider transition ${
                activeTab === "overview"
                  ? "bg-[var(--brass)] text-[var(--ink)] font-bold shadow"
                  : "text-[var(--muted)] hover:text-[var(--paper)]"
              }`}
            >
              📊 Market Intelligence &amp; Score
            </button>
            <button
              onClick={() => {
                setActiveTab("compare");
                if (!comparisonResults) runCountryComparison();
              }}
              className={`flex-1 rounded-lg py-2.5 uppercase tracking-wider transition ${
                activeTab === "compare"
                  ? "bg-[var(--brass)] text-[var(--ink)] font-bold shadow"
                  : "text-[var(--muted)] hover:text-[var(--paper)]"
              }`}
            >
              ⚖️ Country Comparison Matrix
            </button>
            <button
              onClick={() => {
                setActiveTab("best");
                if (!bestMarkets) runFindBestMarkets();
              }}
              className={`flex-1 rounded-lg py-2.5 uppercase tracking-wider transition ${
                activeTab === "best"
                  ? "bg-[var(--brass)] text-[var(--ink)] font-bold shadow"
                  : "text-[var(--muted)] hover:text-[var(--paper)]"
              }`}
            >
              🏆 Best Market Finder
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex-1 rounded-lg py-2.5 uppercase tracking-wider transition ${
                activeTab === "saved"
                  ? "bg-[var(--brass)] text-[var(--ink)] font-bold shadow"
                  : "text-[var(--muted)] hover:text-[var(--paper)]"
              }`}
            >
              ★ Saved Analyses ({savedList.length})
            </button>
          </div>

          {/* Tab 1: Comprehensive Market Overview */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              
              {/* KPI Ribbon */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 font-mono text-xs">
                <div className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-4 shadow">
                  <span className="text-[10px] text-[var(--muted)] uppercase block">Opportunity Score</span>
                  <span className={`font-display text-3xl font-bold mt-1 block ${
                    (s?.overall || 0) >= 75 ? "text-emerald-400" : (s?.overall || 0) >= 50 ? "text-[var(--brass)]" : "text-amber-400"
                  }`}>
                    {s?.overall != null ? `${s.overall}/100` : "N/A"}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] mt-1 block truncate">{s?.tier || "Analyzing"}</span>
                </div>

                <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-4 shadow">
                  <span className="text-[10px] text-[var(--muted)] uppercase block">Total Buyers</span>
                  <span className="font-display text-3xl font-bold text-[var(--paper)] mt-1 block">
                    {m ? m.buyerCount : "—"}
                  </span>
                  <span className="text-[10px] text-emerald-400 mt-1 block">
                    {m ? `${m.verifiedBuyerCount} Verified` : "—"}
                  </span>
                </div>

                <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-4 shadow">
                  <span className="text-[10px] text-[var(--muted)] uppercase block">Total Suppliers</span>
                  <span className="font-display text-3xl font-bold text-[var(--paper)] mt-1 block">
                    {m ? m.supplierCount : "—"}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] mt-1 block">Active Exporters</span>
                </div>

                <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-4 shadow">
                  <span className="text-[10px] text-[var(--muted)] uppercase block">Shipment Manifests</span>
                  <span className="font-display text-3xl font-bold text-[var(--brass)] mt-1 block">
                    {m ? m.shipmentCount : "—"}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] mt-1 block">Verified Bills of Lading</span>
                </div>

                <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-4 shadow">
                  <span className="text-[10px] text-[var(--muted)] uppercase block">Total Trade Value</span>
                  <span className="font-display text-2xl font-bold text-emerald-400 mt-1.5 block">
                    {m?.totalShipmentValue ? `$${(m.totalShipmentValue / 1_000_000).toFixed(2)}M` : "$0.00"}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] mt-1 block">Recorded Corridors</span>
                </div>

                <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-4 shadow">
                  <span className="text-[10px] text-[var(--muted)] uppercase block">Avg Shipment Value</span>
                  <span className="font-display text-2xl font-bold text-[var(--paper)] mt-1.5 block">
                    {m?.averageShipmentValue ? `$${Math.round(m.averageShipmentValue).toLocaleString()}` : "N/A"}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] mt-1 block">Per Commercial Manifest</span>
                </div>
              </div>

              {/* Opportunity Score Explanation & Factor Breakdown */}
              {s && (
                <div className="grid gap-6 lg:grid-cols-3 font-mono text-xs">
                  <div className="rounded-2xl border border-[var(--brass)]/40 bg-[var(--ink-2)] p-6 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Composite Opportunity Meter</span>
                      <span className="rounded bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 text-[10px] text-emerald-300 font-bold">
                        {s.tier}
                      </span>
                    </div>

                    <div className="my-6 text-center">
                      <div className="inline-flex h-28 w-28 items-center justify-center rounded-full border-4 border-[var(--brass)] bg-[var(--ink)] shadow-inner">
                        <div>
                          <span className="font-display text-4xl font-bold text-[var(--paper)]">{s.overall}</span>
                          <span className="block text-[10px] text-[var(--muted)]">/ 100</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-[var(--brass)]/15">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[var(--muted)]">Buyer Demand Factor</span>
                          <span className="text-[var(--paper)] font-bold">{s.breakdown.buyerDemand} / 30</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--ink)]">
                          <div className="h-1.5 rounded-full bg-[var(--brass)]" style={{ width: `${(s.breakdown.buyerDemand / 30) * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[var(--muted)]">Shipment Activity Factor</span>
                          <span className="text-[var(--paper)] font-bold">{s.breakdown.shipmentActivity} / 30</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--ink)]">
                          <div className="h-1.5 rounded-full bg-emerald-400" style={{ width: `${(s.breakdown.shipmentActivity / 30) * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[var(--muted)]">Buyer Reliability Factor</span>
                          <span className="text-[var(--paper)] font-bold">{s.breakdown.buyerAvailability} / 20</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--ink)]">
                          <div className="h-1.5 rounded-full bg-sky-400" style={{ width: `${(s.breakdown.buyerAvailability / 20) * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[var(--muted)]">Supplier Competition Balance</span>
                          <span className="text-[var(--paper)] font-bold">{s.breakdown.supplierCompetition} / 20</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--ink)]">
                          <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${(s.breakdown.supplierCompetition / 20) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Positive Factors & Warnings */}
                  <div className="lg:col-span-2 rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-xl space-y-6">
                    <div>
                      <h3 className="font-display text-lg text-[var(--paper)] flex items-center gap-2">
                        <span className="text-emerald-400">✓</span> Positive Growth Indicators
                      </h3>
                      <ul className="mt-3 space-y-2 text-xs text-[var(--muted)]">
                        {s.explanation.positiveFactors.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 bg-[var(--ink)]/60 rounded p-2.5 border border-[var(--brass)]/10">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span className="text-[var(--paper)]">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-[var(--brass)]/15">
                      <h3 className="font-display text-lg text-[var(--paper)] flex items-center gap-2">
                        <span className="text-amber-400">⚠</span> Market Caution &amp; Risk Signals
                      </h3>
                      <ul className="mt-3 space-y-2 text-xs text-[var(--muted)]">
                        {s.explanation.warnings.map((w, i) => (
                          <li key={i} className="flex items-start gap-2 bg-[var(--ink)]/60 rounded p-2.5 border border-amber-500/20">
                            <span className="text-amber-400 font-bold">⚠</span>
                            <span className="text-[var(--paper)]">{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Historical Shipment Trends */}
              <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
                  <div>
                    <FieldLabel>Historical Flow Trends</FieldLabel>
                    <h2 className="font-display text-2xl text-[var(--paper)]">
                      Annual Trade Volume &amp; Value Trajectory
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-[var(--muted)]">
                    Corridor: {country || "Global"} · HS {hsCode || "All"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/export-planner?hsCode=${encodeURIComponent(hsCode || "")}&targetCountry=${encodeURIComponent(country || "")}`}
                    className="rounded-lg border border-[var(--brass)] bg-[var(--brass)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--ink)] hover:brightness-110 shadow transition"
                  >
                    📋 Create Export Plan
                  </Link>
                  <Link
                    href={`/buyer-discovery?hsCode=${encodeURIComponent(hsCode || "")}&country=${encodeURIComponent(country || "")}`}
                    className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-950 transition"
                  >
                    🌍 Discover Buyers for this Corridor
                  </Link>
                  <Link
                    href={`/supplier-discovery?hsCode=${encodeURIComponent(hsCode || "")}&country=${encodeURIComponent(country || "")}`}
                    className="rounded-lg border border-sky-500/40 bg-sky-950/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-sky-400 hover:bg-sky-950 transition"
                  >
                    🚢 Find Suppliers for this Corridor
                  </Link>
                </div>

                {analysis?.trend?.hasData ? (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {analysis.trend.trends.map((t) => (
                        <div key={t.period} className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink)] p-4">
                          <span className="text-[10px] text-[var(--brass)] font-bold block uppercase">Year {t.period}</span>
                          <span className="font-display text-xl text-[var(--paper)] mt-1 block">
                            ${(t.totalValue / 1_000_000).toFixed(2)}M
                          </span>
                          <div className="mt-2 text-[10px] text-[var(--muted)] flex justify-between">
                            <span>{t.shipmentCount} Manifests</span>
                            <span>Avg ${Math.round(t.avgValue).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[var(--brass)]/15 bg-[var(--ink)] p-8 text-center font-mono text-xs">
                    <span className="text-2xl block mb-2">📉</span>
                    <p className="text-[var(--muted)]">{analysis?.trend?.message || "Insufficient historical data for trend analysis."}</p>
                    <p className="text-[10px] text-[var(--muted)] mt-1">As additional bills of lading are ingested into the database, annual trend graphs will auto-populate.</p>
                  </div>
                )}
              </div>

              {/* Buyer & Supplier Intelligence Grid */}
              <div className="grid gap-6 lg:grid-cols-2 font-mono text-xs">
                
                {/* Top Buyers */}
                <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-[10px] text-[var(--brass)] font-bold uppercase">Buyer Intelligence</span>
                        <h3 className="font-display text-xl text-[var(--paper)] mt-0.5">Top Identified Importers</h3>
                      </div>
                      <Link href="/trade-data" className="text-[11px] text-[var(--brass)] hover:underline">
                        Unlock in Directory →
                      </Link>
                    </div>

                    {analysis?.topBuyers && analysis.topBuyers.length > 0 ? (
                      <div className="divide-y divide-[var(--brass)]/10">
                        {analysis.topBuyers.map((b) => (
                          <div key={b.id} className="py-3 flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[var(--paper)]">{b.companyName}</span>
                                {b.verified && (
                                  <span className="rounded bg-emerald-950 border border-emerald-500/40 px-1.5 py-0.2 text-[9px] text-emerald-400">
                                    Verified
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[var(--muted)] mt-0.5">
                                📍 {b.city ? `${b.city}, ` : ""}{b.country} · Volume: {b.importVolume || "Standard"}
                              </p>
                              <p className="text-[10px] text-[var(--brass)] mt-0.5 truncate max-w-xs">{b.product}</p>
                            </div>
                            <div className="text-right">
                              {b.isUnlocked ? (
                                <span className="text-[10px] text-emerald-400">Unlocked</span>
                              ) : (
                                <Link
                                  href={`/trade-data?query=${encodeURIComponent(b.companyName)}`}
                                  className="rounded border border-[var(--brass)]/30 px-2.5 py-1 text-[10px] text-[var(--brass)] hover:bg-[var(--brass)] hover:text-[var(--ink)] transition font-bold"
                                >
                                  Unlock Contact
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[var(--muted)] py-6 text-center">No matching buyer records found for this criteria.</p>
                    )}
                  </div>
                </div>

                {/* Top Suppliers */}
                <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-[10px] text-[var(--brass)] font-bold uppercase">Supplier Intelligence</span>
                        <h3 className="font-display text-xl text-[var(--paper)] mt-0.5">Active Manufacturers &amp; Exporters</h3>
                      </div>
                      <Link href="/trade-data" className="text-[11px] text-[var(--brass)] hover:underline">
                        Explore Suppliers →
                      </Link>
                    </div>

                    {analysis?.topSuppliers && analysis.topSuppliers.length > 0 ? (
                      <div className="divide-y divide-[var(--brass)]/10">
                        {analysis.topSuppliers.map((s) => (
                          <div key={s.id} className="py-3 flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[var(--paper)]">{s.companyName}</span>
                                {s.verified && (
                                  <span className="rounded bg-emerald-950 border border-emerald-500/40 px-1.5 py-0.2 text-[9px] text-emerald-400">
                                    Verified
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[var(--muted)] mt-0.5">
                                📍 {s.city ? `${s.city}, ` : ""}{s.country} · Capacity: {s.exportVolume || "Available"}
                              </p>
                              <p className="text-[10px] text-[var(--brass)] mt-0.5 truncate max-w-xs">{s.product}</p>
                            </div>
                            <div className="text-right">
                              <Link
                                href={`/trade-data?query=${encodeURIComponent(s.companyName)}`}
                                className="rounded border border-[var(--brass)]/30 px-2.5 py-1 text-[10px] text-[var(--muted)] hover:text-[var(--paper)]"
                              >
                                View Profile
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[var(--muted)] py-6 text-center">No supplier entities cataloged for this commodity.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipment Intelligence & Strategic Recommendations */}
              <div className="grid gap-6 lg:grid-cols-2 font-mono text-xs">
                
                {/* Shipment Intelligence */}
                <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-xl">
                  <FieldLabel>Maritime Logistics Manifests</FieldLabel>
                  <h3 className="font-display text-xl text-[var(--paper)] mb-4">Top Trade Routes &amp; Active Shippers</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-[var(--muted)] uppercase block mb-2">Dominant Shipping Routes</span>
                      {analysis?.shipmentIntelligence?.topRoutes && analysis.shipmentIntelligence.topRoutes.length > 0 ? (
                        <div className="space-y-1.5">
                          {analysis.shipmentIntelligence.topRoutes.map((r, i) => (
                            <div key={i} className="flex justify-between bg-[var(--ink)] p-2.5 rounded border border-[var(--brass)]/15">
                              <span className="font-bold text-[var(--paper)]">
                                {r.origin} <span className="text-[var(--brass)]">➔</span> {r.destination}
                              </span>
                              <span className="text-[var(--muted)]">
                                {r.count} shipment(s) · ${(r.totalValue / 1_000).toFixed(1)}k
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[var(--muted)] py-2">No active trade routes recorded.</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[var(--brass)]/15">
                      <span className="text-[10px] text-[var(--muted)] uppercase block mb-2">Key Shippers &amp; Consignees</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[var(--ink)] p-2.5 rounded border border-[var(--brass)]/15">
                          <span className="text-[10px] text-[var(--brass)] block">Top Exporters</span>
                          {analysis?.shipmentIntelligence?.topExporters && analysis.shipmentIntelligence.topExporters.length > 0 ? (
                            analysis.shipmentIntelligence.topExporters.map((e, idx) => (
                              <p key={idx} className="text-[11px] text-[var(--paper)] truncate mt-1">
                                • {e.name}
                              </p>
                            ))
                          ) : (
                            <p className="text-[10px] text-[var(--muted)]">None</p>
                          )}
                        </div>
                        <div className="bg-[var(--ink)] p-2.5 rounded border border-[var(--brass)]/15">
                          <span className="text-[10px] text-sky-400 block">Top Importers</span>
                          {analysis?.shipmentIntelligence?.topImporters && analysis.shipmentIntelligence.topImporters.length > 0 ? (
                            analysis.shipmentIntelligence.topImporters.map((imp, idx) => (
                              <p key={idx} className="text-[11px] text-[var(--paper)] truncate mt-1">
                                • {imp.name}
                              </p>
                            ))
                          ) : (
                            <p className="text-[10px] text-[var(--muted)]">None</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-xl">
                  <FieldLabel>Executive Advisory</FieldLabel>
                  <h3 className="font-display text-xl text-[var(--paper)] mb-4">Strategic EXIM Recommendations</h3>

                  <div className="space-y-3">
                    {analysis?.recommendations && analysis.recommendations.length > 0 ? (
                      analysis.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className={`rounded-xl border p-4 ${
                            rec.type === "action"
                              ? "border-emerald-500/30 bg-emerald-950/20"
                              : rec.type === "caution"
                              ? "border-amber-500/30 bg-amber-950/20"
                              : "border-[var(--brass)]/30 bg-[var(--ink)]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {rec.type === "action" ? "🎯" : rec.type === "caution" ? "🛡️" : "📈"}
                            </span>
                            <span className="font-bold text-[var(--paper)] text-xs">{rec.title}</span>
                          </div>
                          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                            {rec.description}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[var(--muted)]">No recommendations available.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Quality & Transparency Notice */}
              {analysis?.dataQuality && (
                <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-4 flex flex-col sm:flex-row justify-between items-center gap-3 font-mono text-[11px] text-[var(--muted)]">
                  <div className="flex items-center gap-2">
                    <span className="text-base">ℹ️</span>
                    <span>
                      Dataset Source: <strong className="text-[var(--paper)]">{analysis.dataQuality.datasetType}</strong> · Records Analyzed: <strong className="text-[var(--brass)]">{analysis.dataQuality.totalRecordsAnalyzed}</strong>
                    </span>
                  </div>
                  <span>
                    Confidence Rating: <strong className="text-emerald-400">{analysis.dataQuality.confidenceLevel}</strong> · Refreshed: {new Date(analysis.dataQuality.lastRefreshed).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Country Comparison Matrix */}
          {activeTab === "compare" && (
            <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 md:p-8 shadow-2xl font-mono text-xs space-y-6">
              <div>
                <FieldLabel>Cross-Border Market Matrix</FieldLabel>
                <h2 className="font-display text-2xl text-[var(--paper)]">
                  Compare Target Import Destinations for HS {hsCode || "Selected Product"}
                </h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Benchmark 2 to 5 countries side-by-side on opportunity score, buyer availability, and trade flow capacity.
                </p>
              </div>

              {/* Country Selection Tags */}
              <div className="flex flex-wrap items-center gap-2">
                {compareCountries.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brass)]/15 border border-[var(--brass)]/40 px-3 py-1 text-xs text-[var(--brass)] font-bold"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => removeCompareCountry(c)}
                      className="text-[var(--muted)] hover:text-red-400 ml-1"
                    >
                      ✕
                    </button>
                  </span>
                ))}

                {compareCountries.length < 5 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add country…"
                      value={newCompareCountry}
                      onChange={(e) => setNewCompareCountry(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCompareCountry();
                        }
                      }}
                      className="rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-2.5 py-1 text-xs text-[var(--paper)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={addCompareCountry}
                      className="rounded bg-[var(--brass)] px-3 py-1 font-bold text-[var(--ink)]"
                    >
                      + Add
                    </button>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={runCountryComparison}
                  disabled={comparing}
                  className="ml-auto rounded bg-[var(--brass)] px-4 py-2 font-bold text-[var(--ink)] uppercase hover:brightness-110 shadow disabled:opacity-50"
                >
                  {comparing ? "Comparing…" : "⚡ Run Comparison"}
                </button>
              </div>

              {compareError && (
                <div className="rounded-lg border border-red-500/40 bg-red-950/60 p-4 text-red-300">
                  {compareError}
                </div>
              )}

              {/* Comparison Results Table */}
              {comparisonResults && comparisonResults.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-[var(--brass)]/30 bg-[var(--ink)]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--brass)]/25 bg-[var(--ink-2)] text-[var(--brass)] uppercase text-[10px]">
                        <th className="p-4">Rank &amp; Country</th>
                        <th className="p-4">Opportunity Score</th>
                        <th className="p-4">Total Buyers</th>
                        <th className="p-4">Verified Suppliers</th>
                        <th className="p-4">Shipments Logged</th>
                        <th className="p-4">Total Value</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--brass)]/15 text-[var(--paper)]">
                      {comparisonResults.map((res, i) => (
                        <tr key={res.country} className="hover:bg-[var(--ink-2)]/40 transition">
                          <td className="p-4 font-bold flex items-center gap-2">
                            <span className="text-[var(--brass)]">#{i + 1}</span>
                            <span>{res.country}</span>
                          </td>
                          <td className="p-4 font-bold">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              res.score.overall >= 75
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                                : res.score.overall >= 50
                                ? "bg-amber-950 text-[var(--brass)] border border-[var(--brass)]/30"
                                : "bg-zinc-900 text-[var(--muted)]"
                            }`}>
                              {res.score.overall}/100 · {res.score.tier}
                            </span>
                          </td>
                          <td className="p-4">{res.metrics.buyerCount} ({res.metrics.verifiedBuyerCount} Verified)</td>
                          <td className="p-4">{res.metrics.supplierCount}</td>
                          <td className="p-4">{res.metrics.shipmentCount}</td>
                          <td className="p-4 font-bold text-emerald-400">
                            {res.metrics.totalShipmentValue > 0
                              ? `$${(res.metrics.totalShipmentValue / 1_000_000).toFixed(2)}M`
                              : "$0.00"}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setCountry(res.country);
                                fetchAnalysis(hsCode, res.country, direction, year);
                                setActiveTab("overview");
                              }}
                              className="rounded border border-[var(--brass)]/40 px-3 py-1 text-[10px] text-[var(--brass)] hover:bg-[var(--brass)] hover:text-[var(--ink)] font-bold"
                            >
                              Analyze →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Best Markets Finder */}
          {activeTab === "best" && (
            <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 md:p-8 shadow-2xl font-mono text-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <FieldLabel>Global Opportunity Ranking</FieldLabel>
                  <h2 className="font-display text-2xl text-[var(--paper)]">
                    Top Ranked Export Destinations for HS {hsCode || "Selected HS"}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Automatically discovers highest scoring destination markets with direct buyer leads and trade velocity.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={runFindBestMarkets}
                  disabled={loadingBest}
                  className="rounded bg-[var(--brass)] px-4 py-2 font-bold text-[var(--ink)] uppercase hover:brightness-110 shadow"
                >
                  {loadingBest ? "Discovering…" : "🔄 Refresh Rankings"}
                </button>
              </div>

              {bestMarketsError && (
                <div className="rounded-lg border border-red-500/40 bg-red-950/60 p-4 text-red-300">
                  {bestMarketsError}
                </div>
              )}

              {loadingBest ? (
                <div className="py-12 text-center text-[var(--brass)]">
                  <span className="h-4 w-4 rounded-full border-2 border-[var(--brass)] border-t-transparent animate-spin inline-block mr-2" />
                  Calculating optimal global market corridors…
                </div>
              ) : bestMarkets && bestMarkets.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {bestMarkets.map((bm, idx) => (
                    <div
                      key={bm.country}
                      className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink)] p-5 flex flex-col justify-between hover:border-[var(--brass)] transition shadow"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="font-display text-2xl font-bold text-[var(--brass)]">#{idx + 1}</span>
                          <span className="rounded bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 text-[10px] text-emerald-400 font-bold">
                            Score: {bm.score.overall}/100
                          </span>
                        </div>
                        <h3 className="font-display mt-2 text-xl text-[var(--paper)]">{bm.country}</h3>
                        <div className="mt-3 space-y-1 text-[11px] text-[var(--muted)]">
                          <p>👥 <strong className="text-[var(--paper)]">{bm.metrics.buyerCount}</strong> Buyer Entities</p>
                          <p>🚢 <strong className="text-[var(--paper)]">{bm.metrics.shipmentCount}</strong> Customs Manifests</p>
                          <p>💰 <strong className="text-emerald-400">${(bm.metrics.totalShipmentValue / 1_000_000).toFixed(2)}M</strong> Trade Volume</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[var(--brass)]/15 space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCountry(bm.country);
                            fetchAnalysis(hsCode, bm.country, direction, year);
                            setActiveTab("overview");
                          }}
                          className="w-full rounded bg-[var(--ink-2)] border border-[var(--brass)]/30 py-2 text-center text-xs font-bold text-[var(--brass)] hover:bg-[var(--brass)] hover:text-[var(--ink)] transition"
                        >
                          Deep-Dive Corridor →
                        </button>
                        <Link
                          href={`/export-planner?hsCode=${encodeURIComponent(hsCode || "")}&targetCountry=${encodeURIComponent(bm.country)}`}
                          className="w-full block rounded bg-[var(--brass)] py-2 text-center text-xs font-bold uppercase text-[var(--ink)] hover:brightness-110 shadow transition"
                        >
                          📋 Create Export Plan
                        </Link>
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href={`/buyer-discovery?hsCode=${encodeURIComponent(hsCode || "")}&country=${encodeURIComponent(bm.country)}`}
                            className="rounded border border-emerald-500/30 py-2 text-center text-[10px] font-bold uppercase text-emerald-400 hover:bg-emerald-950/60 transition"
                          >
                            🌍 Discover Buyers
                          </Link>
                          <Link
                            href={`/supplier-discovery?hsCode=${encodeURIComponent(hsCode || "")}&country=${encodeURIComponent(bm.country)}`}
                            className="rounded border border-sky-500/30 py-2 text-center text-[10px] font-bold uppercase text-sky-400 hover:bg-sky-950/60 transition"
                          >
                            🚢 Find Suppliers
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : bestMarkets && bestMarkets.length === 0 ? (
                <div className="p-8 text-center text-[var(--muted)] border border-[var(--brass)]/20 rounded-xl">
                  No market matches were found for this HS code.
                </div>
              ) : (
                <div className="p-8 text-center text-[var(--muted)] border border-[var(--brass)]/20 rounded-xl">
                  Click &quot;Refresh Rankings&quot; to analyze and score all global market destinations for HS {hsCode || "Selected HS"}.
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Saved Analyses Portfolio */}
          {activeTab === "saved" && (
            <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 md:p-8 shadow-2xl font-mono text-xs space-y-6">
              <div>
                <FieldLabel>Analyses Portfolio</FieldLabel>
                <h2 className="font-display text-2xl text-[var(--paper)]">
                  Your Saved Market Intelligence Dossiers
                </h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Track and monitor customized market analyses. One-click re-run recalculates fresh opportunity metrics against live database updates.
                </p>
              </div>

              {savedList.length === 0 ? (
                <div className="p-12 text-center border border-[var(--brass)]/20 rounded-xl bg-[var(--ink)]">
                  <span className="text-3xl block mb-2">📑</span>
                  <p className="text-[var(--paper)] font-bold">No saved market analyses yet.</p>
                  <p className="text-[var(--muted)] mt-1">Run an analysis in the Overview tab and click &quot;★ Save Analysis&quot; to bookmark it here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[var(--brass)]/30 bg-[var(--ink)]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--brass)]/25 bg-[var(--ink-2)] text-[var(--brass)] uppercase text-[10px]">
                        <th className="p-4">HS Code</th>
                        <th className="p-4">Target Market</th>
                        <th className="p-4">Direction</th>
                        <th className="p-4">Saved Score</th>
                        <th className="p-4">Saved Date</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--brass)]/15 text-[var(--paper)]">
                      {savedList.map((item) => (
                        <tr key={item.id} className="hover:bg-[var(--ink-2)]/40 transition">
                          <td className="p-4 font-bold text-[var(--brass)]">HS {item.hsCode || "General"}</td>
                          <td className="p-4 font-bold">{item.country || "Global"}</td>
                          <td className="p-4 uppercase text-[10px] text-[var(--muted)]">{item.direction || "export"}</td>
                          <td className="p-4">
                            <span className="font-bold text-emerald-400">{item.opportunityScore}/100</span>
                          </td>
                          <td className="p-4 text-[var(--muted)]">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => handleRerunSaved(item.id)}
                              className="rounded border border-[var(--brass)]/40 px-3 py-1 text-[10px] text-[var(--brass)] hover:bg-[var(--brass)] hover:text-[var(--ink)] font-bold"
                            >
                              Re-run ⚡
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSaved(item.id)}
                              className="rounded border border-red-500/40 px-3 py-1 text-[10px] text-red-400 hover:bg-red-950 font-bold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Static Commodity Sector Reference Grid */}
          <section className="mt-12 pt-8 border-t border-[var(--brass)]/20">
            <div className="flex justify-between items-end mb-6 font-mono">
              <div>
                <FieldLabel>Sector Benchmark Reference</FieldLabel>
                <h2 className="font-display text-2xl text-[var(--paper)]">
                  Global Commodity Trade Outflows
                </h2>
              </div>
              <Link href="/hs-codes" className="text-xs text-[var(--brass)] hover:underline">
                Explore All 99 Chapters →
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 font-mono text-xs">
              {SECTOR_TRENDS.map((sec) => (
                <div
                  key={sec.name}
                  className="flex flex-col justify-between rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 transition hover:border-[var(--brass)]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--brass)] font-bold">HS {sec.hs}</span>
                      <span className="rounded bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 text-[10px] text-emerald-400">
                        {sec.growth} YoY
                      </span>
                    </div>
                    <h3 className="font-display mt-3 text-lg text-[var(--paper)]">{sec.name}</h3>
                    <div className="mt-4 rounded bg-[var(--ink)] p-3 space-y-1 text-[11px]">
                      <div className="flex justify-between text-[var(--muted)]">
                        <span>Total Volume:</span>
                        <span className="text-[var(--paper)] font-bold">{sec.volume}</span>
                      </div>
                      <div className="flex justify-between text-[var(--muted)]">
                        <span>Key Destination:</span>
                        <span className="text-[var(--brass)] truncate max-w-[140px]">{sec.topBuyer}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[var(--brass)]/15">
                    <button
                      type="button"
                      onClick={() => {
                        setHsCode(sec.hs);
                        fetchAnalysis(sec.hs, country, direction, year);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="w-full text-left text-[var(--brass)] hover:underline flex justify-between items-center"
                    >
                      <span>Analyze this sector</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </AuthGuard>
  );
}
