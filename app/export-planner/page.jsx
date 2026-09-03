'use client';

// app/export-planner/page.jsx
// Stage 3 Phase 3 — Complete Export Opportunity Planner UI

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import FieldLabel from '@/components/FieldLabel';
import AuthGuard from '@/components/AuthGuard';

const POPULAR_COUNTRIES = [
  'United Arab Emirates',
  'Germany',
  'United States',
  'Saudi Arabia',
  'United Kingdom',
  'Singapore',
  'Australia',
  'France',
  'Japan',
  'Netherlands',
];

function ExportPlannerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Form Inputs — HS Code is strictly string
  const [product, setProduct] = useState(searchParams.get('product') || '');
  const [hsCode, setHsCode] = useState(searchParams.get('hsCode') || '010121');
  const [originCountry, setOriginCountry] = useState(searchParams.get('originCountry') || 'India');
  const [targetCountry, setTargetCountry] = useState(searchParams.get('targetCountry') || 'United Arab Emirates');
  const [price, setPrice] = useState(searchParams.get('price') || '1200');
  const [quantity, setQuantity] = useState(searchParams.get('quantity') || '50');
  const [currency] = useState('USD');
  const [shipping, setShipping] = useState(searchParams.get('shipping') || '2500');
  const [insurance, setInsurance] = useState(searchParams.get('insurance') || '350');
  const [otherCosts, setOtherCosts] = useState(searchParams.get('otherCosts') || '600');
  const [targetSellingPrice, setTargetSellingPrice] = useState(searchParams.get('targetSellingPrice') || '1550');

  // Analysis state
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [savingLeadId, setSavingLeadId] = useState(null);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/export-planner/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hsCode,
          product,
          originCountry,
          targetCountry,
          price: parseFloat(price) || 0,
          quantity: parseFloat(quantity) || 1,
          shipping: parseFloat(shipping) || 0,
          insurance: parseFloat(insurance) || 0,
          otherCosts: parseFloat(otherCosts) || 0,
          targetSellingPrice: targetSellingPrice ? parseFloat(targetSellingPrice) : null,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate export analysis');
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      setError(err.message || 'Network error analyzing opportunity');
    } finally {
      setLoading(false);
    }
  }, [hsCode, product, originCountry, targetCountry, price, quantity, shipping, insurance, otherCosts, targetSellingPrice]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  const handleSavePlan = async () => {
    if (!analysis) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/export-planner/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${product || 'Export'} Opportunity Plan (${targetCountry})`,
          hsCode,
          product,
          originCountry,
          targetCountry,
          price,
          quantity,
          shipping,
          insurance,
          otherCosts,
          targetSellingPrice,
          analysisResult: analysis,
        }),
      });

      if (!res.ok) throw new Error('Save failed');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 4000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  const handleSaveLead = async (buyer) => {
    setSavingLeadId(buyer.id);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'BUYER',
          entityId: buyer.id,
          leadScore: buyer.leadScore,
          notes: `Added from Export Planner for ${targetCountry} (${hsCode})`,
        }),
      });

      if (res.status === 409) {
        alert('Lead is already in your My Leads pipeline.');
      } else if (!res.ok) {
        alert('Failed to save lead.');
      } else {
        alert(`${buyer.companyName} saved to My Leads pipeline!`);
      }
    } catch {
      alert('Error connecting to CRM service.');
    } finally {
      setSavingLeadId(null);
    }
  };

  const handlePrintReport = () => {
    if (!analysis) return;
    try {
      sessionStorage.setItem('gb_current_export_plan', JSON.stringify(analysis));
      window.open('/export-planner/report', '_blank');
    } catch {
      alert('Could not cache report session. You can print this page directly using Ctrl+P.');
    }
  };

  const scores = analysis?.scores || {};
  const rec = analysis?.recommendation || {};
  const risk = analysis?.riskAssessment || {};
  const readiness = analysis?.readinessAssessment || {};
  const landed = analysis?.landedCost || {};
  const metrics = analysis?.marketMetrics || {};

  const getDecisionBadge = (decision) => {
    switch (decision) {
      case 'ENTER_NOW':
        return 'bg-emerald-950 border-emerald-500/50 text-emerald-400';
      case 'ENTER_WITH_CAUTION':
        return 'bg-amber-950 border-amber-500/50 text-amber-300';
      case 'RESEARCH_MORE':
        return 'bg-sky-950 border-sky-500/50 text-sky-300';
      case 'AVOID':
        return 'bg-rose-950 border-rose-500/50 text-rose-300';
      default:
        return 'bg-[var(--ink)] border-[var(--brass)]/30 text-[var(--paper)]';
    }
  };

  return (
    <main className="min-h-screen bg-[var(--ink)] text-[var(--paper)]">
      {/* Hero Bar */}
      <section className="border-b border-[var(--brass)]/20 bg-gradient-to-b from-[var(--ink-2)] via-[var(--ink)] to-[var(--ink)] px-4 py-8 sm:px-6 md:py-12">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <FieldLabel>Export Decision Support System</FieldLabel>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-[var(--paper)] mt-2">
              Export Opportunity Planner
            </h1>
            <p className="mt-2 max-w-3xl font-mono text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              Synthesizes market velocity, buyer discovery, tariff duty schedules, corridor risk, and landed margins into deterministic commercial recommendations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 font-mono text-xs">
            <button
              onClick={handleSavePlan}
              disabled={loading || !analysis || saveStatus === 'saving'}
              className="rounded bg-[var(--brass)] px-4 py-2.5 font-bold uppercase tracking-wider text-[var(--ink)] hover:brightness-110 disabled:opacity-50 transition shadow"
            >
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Plan Saved' : '💾 Save Plan'}
            </button>
            <button
              onClick={handlePrintReport}
              disabled={loading || !analysis}
              className="rounded border border-[var(--brass)] px-4 py-2.5 font-bold uppercase tracking-wider text-[var(--brass)] hover:bg-[var(--brass)] hover:text-[var(--ink)] disabled:opacity-50 transition"
            >
              📄 Intelligence Report
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
        {/* Sections 1, 2, 3: Export Inputs Configuration */}
        <section className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--brass)]/20 pb-4 mb-6">
            <div>
              <FieldLabel>Parameters</FieldLabel>
              <h2 className="font-display text-xl text-[var(--paper)]">Export Parameters & Commodity Settings</h2>
            </div>
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="rounded bg-emerald-600 px-4 py-1.5 font-mono text-xs font-bold uppercase text-white hover:bg-emerald-500 disabled:opacity-50 transition"
            >
              {loading ? 'Analyzing…' : '⚡ Re-Calculate'}
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-3 font-mono text-xs">
            {/* Section 1: Product & HS Code */}
            <div className="space-y-4">
              <span className="text-[10px] text-[var(--brass)] uppercase font-bold tracking-wider block">
                1. Product & Commodity Classification
              </span>
              <div>
                <label className="block text-[var(--muted)] mb-1">Product Name / Commodity</label>
                <input
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g. Purebred Breeding Horses"
                  className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)] focus:border-[var(--brass)]"
                />
              </div>
              <div>
                <label className="block text-[var(--muted)] mb-1">
                  HS Code (String Identifier — Leading Zeros Preserved)
                </label>
                <input
                  type="text"
                  value={hsCode}
                  onChange={(e) => setHsCode(e.target.value)}
                  placeholder="010121"
                  className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--brass)] font-bold focus:border-[var(--brass)]"
                />
                <span className="text-[10px] text-[var(--muted)] block mt-1">
                  Format: 6-digit chapter/sub-heading (e.g. 010121, 090411)
                </span>
              </div>
            </div>

            {/* Section 2: Export Cost & Financial Inputs */}
            <div className="space-y-4">
              <span className="text-[10px] text-[var(--brass)] uppercase font-bold tracking-wider block">
                2. Commercial Economics & Freight
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--muted)] mb-1">FOB Price ({currency})</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Export Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[var(--muted)] mb-1">Freight</label>
                  <input
                    type="number"
                    value={shipping}
                    onChange={(e) => setShipping(e.target.value)}
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-2 py-2 text-[var(--paper)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Insurance</label>
                  <input
                    type="number"
                    value={insurance}
                    onChange={(e) => setInsurance(e.target.value)}
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-2 py-2 text-[var(--paper)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Other Fees</label>
                  <input
                    type="number"
                    value={otherCosts}
                    onChange={(e) => setOtherCosts(e.target.value)}
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-2 py-2 text-[var(--paper)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[var(--muted)] mb-1">Target CIF/Retail Price per unit ({currency})</label>
                <input
                  type="number"
                  value={targetSellingPrice}
                  onChange={(e) => setTargetSellingPrice(e.target.value)}
                  placeholder="Optional benchmark for margin calculation"
                  className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-emerald-400"
                />
              </div>
            </div>

            {/* Section 3: Target Market */}
            <div className="space-y-4">
              <span className="text-[10px] text-[var(--brass)] uppercase font-bold tracking-wider block">
                3. Trade Corridor Routing
              </span>
              <div>
                <label className="block text-[var(--muted)] mb-1">Origin Exporter Country</label>
                <input
                  type="text"
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                  className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]"
                />
              </div>
              <div>
                <label className="block text-[var(--muted)] mb-1">Target Destination Market</label>
                <select
                  value={targetCountry}
                  onChange={(e) => setTargetCountry(e.target.value)}
                  className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]"
                >
                  <option value="">Select Destination Country…</option>
                  {POPULAR_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-2">
                <span className="text-[10px] text-[var(--muted)] block mb-1">Quick Select Markets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_COUNTRIES.slice(0, 4).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTargetCountry(c)}
                      className="rounded bg-[var(--ink)] border border-[var(--brass)]/20 px-2 py-1 text-[10px] text-[var(--brass)] hover:border-[var(--brass)]"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 font-mono text-xs text-rose-300">
            ⚠ {error}
          </div>
        )}

        {/* Section 4: Opportunity Score Banner & Decision Verdict */}
        <section className="grid gap-6 lg:grid-cols-3 font-mono text-xs">
          {/* Main Opportunity Score Card */}
          <div className="rounded-2xl border border-[var(--brass)]/40 bg-gradient-to-br from-[var(--ink-2)] to-[var(--ink)] p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <FieldLabel>Section 4</FieldLabel>
              <h2 className="font-display text-2xl text-[var(--paper)] mt-1">Export Opportunity Score</h2>
              <div className="mt-6 flex items-baseline gap-4">
                <span className="font-display text-6xl font-bold text-[var(--brass)]">
                  {scores.finalOpportunityScore ?? '—'}
                </span>
                <span className="text-xl text-[var(--muted)]">/ 100</span>
              </div>
              <p className="mt-2 text-xs text-[var(--paper)]">
                Weighted index balancing market volume, buyer demand, trade risk, and landed cost margins.
              </p>
            </div>

            <div className="mt-6 space-y-2 border-t border-[var(--brass)]/20 pt-4 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Market Score:</span>
                <span className="font-bold text-[var(--paper)]">{scores.marketOpportunityScore ?? '—'}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Buyer Demand:</span>
                <span className="font-bold text-emerald-400">{scores.buyerDemandScore ?? '—'}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Competition Safety:</span>
                <span className="font-bold text-sky-400">{scores.competitionScore ?? '—'}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Corridor Risk:</span>
                <span className="font-bold text-amber-400">{scores.tradeRiskScore ?? '—'}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Readiness Index:</span>
                <span className="font-bold text-emerald-400">{scores.exportReadinessScore ?? '—'}/100</span>
              </div>
            </div>
          </div>

          {/* Section 10: Market Entry Recommendation */}
          <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-2xl lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <FieldLabel>Section 10</FieldLabel>
                  <h2 className="font-display text-2xl text-[var(--paper)] mt-1">
                    Market Entry Recommendation
                  </h2>
                </div>
                <span
                  className={`rounded-xl border px-3.5 py-1.5 font-bold uppercase tracking-wider text-sm ${getDecisionBadge(
                    rec.decision
                  )}`}
                >
                  {rec.decision ? rec.decision.replace(/_/g, ' ') : 'ANALYZING…'}
                </span>
              </div>

              <div className="space-y-3 mt-4">
                <div>
                  <span className="text-[10px] text-[var(--brass)] uppercase font-bold block mb-1">
                    Strategic Rationale:
                  </span>
                  <ul className="space-y-1 text-[var(--paper)]">
                    {rec.reasons?.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{r}</span>
                      </li>
                    )) || <li>Evaluating market conditions…</li>}
                  </ul>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 pt-2">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">
                      Key Advantages:
                    </span>
                    <ul className="space-y-1 text-[11px] text-[var(--muted)]">
                      {rec.advantages?.map((adv, i) => (
                        <li key={i}>• {adv}</li>
                      )) || <li>No distinct advantages flagged.</li>}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3">
                    <span className="text-[10px] text-amber-300 uppercase font-bold block mb-1">
                      Risks to Monitor:
                    </span>
                    <ul className="space-y-1 text-[11px] text-[var(--muted)]">
                      {rec.risks?.map((r, i) => (
                        <li key={i}>• {r}</li>
                      )) || <li>Standard trade risks apply.</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--brass)]/15">
              <span className="text-[10px] text-[var(--brass)] uppercase font-bold block mb-1">
                Required Next Actions:
              </span>
              <div className="flex flex-wrap gap-2">
                {rec.requiredActions?.map((act, i) => (
                  <span
                    key={i}
                    className="rounded bg-[var(--ink)] border border-[var(--brass)]/20 px-2.5 py-1 text-[11px] text-[var(--paper)]"
                  >
                    → {act}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 5 & 6: Market & Buyer Intelligence */}
        <section className="grid gap-6 lg:grid-cols-2 font-mono text-xs">
          {/* Section 5: Market Intelligence */}
          <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-xl space-y-4">
            <div>
              <FieldLabel>Section 5</FieldLabel>
              <h3 className="font-display text-xl text-[var(--paper)] mt-1">Market Activity Signals</h3>
              <p className="text-[11px] text-[var(--muted)]">Database-backed manifest records for this corridor</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink)] p-3">
                <span className="text-[10px] uppercase text-[var(--muted)]">Buyer Entities</span>
                <p className="font-display text-xl text-[var(--paper)] mt-1">{metrics.buyerCount ?? 0}</p>
                <span className="text-[10px] text-emerald-400">
                  {metrics.verifiedBuyerCount ?? 0} Verified
                </span>
              </div>
              <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink)] p-3">
                <span className="text-[10px] uppercase text-[var(--muted)]">Suppliers</span>
                <p className="font-display text-xl text-[var(--paper)] mt-1">{metrics.supplierCount ?? 0}</p>
                <span className="text-[10px] text-sky-400">Competing Firms</span>
              </div>
              <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink)] p-3 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase text-[var(--muted)]">Customs Manifests</span>
                <p className="font-display text-xl text-[var(--paper)] mt-1">{metrics.shipmentCount ?? 0}</p>
                <span className="text-[10px] text-[var(--brass)]">
                  ${metrics.totalShipmentValue ? (metrics.totalShipmentValue / 1_000_000).toFixed(2) : 0}M Vol
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--brass)]/15 bg-[var(--ink)] p-4">
              <span className="text-[10px] text-[var(--brass)] font-bold uppercase block mb-2">
                Data Availability Disclosure
              </span>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                Platform metrics reflect verified bills of lading and cataloged corporate entities stored in the GlobeBridge trade database. Values are strictly deterministic with no simulated random figures.
              </p>
            </div>
          </div>

          {/* Section 7: Tariff & Landed Cost Economics */}
          <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-xl space-y-4">
            <div>
              <FieldLabel>Section 7</FieldLabel>
              <h3 className="font-display text-xl text-[var(--paper)] mt-1">Tariff Schedule & Landed Cost</h3>
              <p className="text-[11px] text-[var(--muted)]">Calculated import customs duty stack & unit economics</p>
            </div>

            {landed.available ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-emerald-500/30 bg-[var(--ink)] p-3">
                    <span className="text-[10px] uppercase text-[var(--muted)]">Total Landed Cost</span>
                    <p className="font-display text-xl text-emerald-400 mt-1">
                      ${landed.totalLandedCost?.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-[var(--muted)]">
                      ${landed.costPerUnit}/unit for {quantity} units
                    </span>
                  </div>
                  <div className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink)] p-3">
                    <span className="text-[10px] uppercase text-[var(--muted)]">Estimated Margin</span>
                    <p
                      className={`font-display text-xl mt-1 ${
                        landed.estimatedMargin && landed.estimatedMargin > 0
                          ? 'text-emerald-400'
                          : 'text-amber-300'
                      }`}
                    >
                      {landed.marginPercentage !== null ? `${landed.marginPercentage}%` : 'N/A'}
                    </p>
                    <span className="text-[10px] text-[var(--muted)]">
                      {landed.estimatedMargin !== null
                        ? `$${landed.estimatedMargin.toLocaleString()} net profit`
                        : 'Set target price above'}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink)] p-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Product Cost ({quantity} × ${price}):</span>
                    <span className="text-[var(--paper)]">${landed.productCost?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Freight & Shipping:</span>
                    <span className="text-[var(--paper)]">${landed.shipping?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Marine Cargo Insurance:</span>
                    <span className="text-[var(--paper)]">${landed.insurance?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--brass)]/15 pt-1">
                    <span className="text-[var(--brass)]">
                      Customs Duty (BCD {landed.customsDuty?.rates?.bcd}, IGST {landed.customsDuty?.rates?.igst}):
                    </span>
                    <span className="font-bold text-[var(--brass)]">
                      ${landed.customsDuty?.total?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Port Handling & Other Fees:</span>
                    <span className="text-[var(--paper)]">${landed.otherCosts?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-5 space-y-2">
                <span className="rounded bg-amber-950 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase">
                  Tariff Data Not Available
                </span>
                <p className="text-[var(--paper)] font-medium">
                  {landed.reason || 'Official customs tariff rates not cataloged in database for this HS code.'}
                </p>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                  Base landed cost without destination import duty is estimated at{' '}
                  <strong className="text-[var(--paper)]">${landed.totalLandedCost?.toLocaleString()}</strong> ($
                  {landed.costPerUnit}/unit). Verify statutory BCD/VAT rates with destination customs brokers.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Section 8 & 9: Risk Analysis & Export Readiness */}
        <section className="grid gap-6 lg:grid-cols-2 font-mono text-xs">
          {/* Section 8: Risk Analysis */}
          <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <FieldLabel>Section 8</FieldLabel>
                <h3 className="font-display text-xl text-[var(--paper)] mt-1">Trade Risk Analysis</h3>
              </div>
              <span
                className={`rounded border px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                  risk.level === 'HIGH'
                    ? 'border-rose-500/50 bg-rose-950/80 text-rose-300'
                    : risk.level === 'MEDIUM'
                    ? 'border-amber-500/50 bg-amber-950/80 text-amber-300'
                    : 'border-emerald-500/50 bg-emerald-950/80 text-emerald-400'
                }`}
              >
                {risk.level || 'MEDIUM'} RISK ({risk.score ?? 50}/100)
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[var(--brass)] uppercase font-bold block mb-1">
                Risk Factors Detected:
              </span>
              <ul className="space-y-1.5">
                {risk.factors?.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 bg-[var(--ink)]/80 rounded p-2 border border-[var(--brass)]/15">
                    <span className="text-amber-400 font-bold">⚠</span>
                    <span className="text-[var(--paper)]">{f}</span>
                  </li>
                )) || <li>Analyzing corridor risk metrics…</li>}
              </ul>
            </div>

            <div className="border-t border-[var(--brass)]/15 pt-3">
              <span className="text-[10px] text-[var(--brass)] uppercase font-bold block mb-1">
                Recommended Risk Mitigations:
              </span>
              <ul className="space-y-1 text-[11px] text-[var(--muted)]">
                {risk.recommendations?.map((r, i) => (
                  <li key={i}>• {r}</li>
                )) || <li>Follow standard trade finance practices.</li>}
              </ul>
            </div>
          </div>

          {/* Section 9: Export Readiness */}
          <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <FieldLabel>Section 9</FieldLabel>
                <h3 className="font-display text-xl text-[var(--paper)] mt-1">Export Readiness Score</h3>
              </div>
              <span
                className={`rounded border px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                  readiness.level === 'READY'
                    ? 'border-emerald-500/50 bg-emerald-950/80 text-emerald-400'
                    : readiness.level === 'MODERATE'
                    ? 'border-amber-500/50 bg-amber-950/80 text-amber-300'
                    : 'border-rose-500/50 bg-rose-950/80 text-rose-300'
                }`}
              >
                {readiness.level ? readiness.level.replace(/_/g, ' ') : 'EVALUATING'} ({readiness.score ?? 50}/100)
              </span>
            </div>

            {readiness.blockers && readiness.blockers.length > 0 && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-3.5 space-y-1">
                <span className="text-[10px] text-rose-300 uppercase font-bold block">
                  Commercial Blockers to Resolve:
                </span>
                <ul className="space-y-1 text-[11px] text-rose-200">
                  {readiness.blockers.map((b, i) => (
                    <li key={i}>⛔ {b}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <span className="text-[10px] text-[var(--brass)] uppercase font-bold block mb-1">
                Preparation Guidelines:
              </span>
              <ul className="space-y-1 text-[11px] text-[var(--muted)]">
                {readiness.recommendations?.map((recItem, i) => (
                  <li key={i}>✓ {recItem}</li>
                )) || <li>Export parameters evaluated.</li>}
              </ul>
            </div>

            {readiness.breakdown && (
              <div className="grid grid-cols-4 gap-2 border-t border-[var(--brass)]/15 pt-3 text-center text-[10px]">
                <div className="bg-[var(--ink)] p-1.5 rounded border border-[var(--brass)]/15">
                  <span className="text-[var(--muted)] block">HS Match</span>
                  <strong className="text-[var(--paper)]">{readiness.breakdown.hsClassification}/15</strong>
                </div>
                <div className="bg-[var(--ink)] p-1.5 rounded border border-[var(--brass)]/15">
                  <span className="text-[var(--muted)] block">Buyers</span>
                  <strong className="text-[var(--paper)]">{readiness.breakdown.buyerAvailability}/15</strong>
                </div>
                <div className="bg-[var(--ink)] p-1.5 rounded border border-[var(--brass)]/15">
                  <span className="text-[var(--muted)] block">Demand</span>
                  <strong className="text-[var(--paper)]">{readiness.breakdown.marketDemand}/15</strong>
                </div>
                <div className="bg-[var(--ink)] p-1.5 rounded border border-[var(--brass)]/15">
                  <span className="text-[var(--muted)] block">Cost Eff</span>
                  <strong className="text-[var(--paper)]">{readiness.breakdown.costEfficiency}/10</strong>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 11: Recommended Buyers (Buyer-to-Market Matching) */}
        <section className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--brass)]/20 pb-4">
            <div>
              <FieldLabel>Section 11</FieldLabel>
              <h2 className="font-display text-2xl text-[var(--paper)] mt-1">
                Top Matched Foreign Buyer Leads
              </h2>
              <p className="font-mono text-xs text-[var(--muted)] mt-0.5">
                Evaluated against commodity HS Code {hsCode} in {targetCountry || 'Target Market'}
              </p>
            </div>

            <Link
              href={`/buyer-discovery?hsCode=${encodeURIComponent(hsCode)}&country=${encodeURIComponent(targetCountry)}`}
              className="rounded border border-[var(--brass)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--brass)] hover:bg-[var(--brass)] hover:text-[var(--ink)] transition text-center"
            >
              Open Full Buyer Discovery →
            </Link>
          </div>

          {analysis?.recommendedBuyers && analysis.recommendedBuyers.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 font-mono text-xs">
              {analysis.recommendedBuyers.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink)] p-4 flex flex-col justify-between hover:border-[var(--brass)]/60 transition shadow"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display text-base text-[var(--paper)] font-bold truncate">
                        {b.companyName}
                      </h4>
                      {b.verified && (
                        <span className="rounded bg-emerald-950 border border-emerald-500/40 px-1.5 py-0.2 text-[9px] text-emerald-400 shrink-0">
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-[var(--brass)] mt-0.5">
                      📍 {b.city ? `${b.city}, ` : ''}{b.country}
                    </p>

                    <div className="mt-3 rounded bg-[var(--ink-2)] p-2.5 space-y-1 text-[11px] text-[var(--muted)] border border-[var(--brass)]/15">
                      <p className="truncate">
                        <span className="text-[var(--paper)]">Product:</span> {b.product || 'Standard'}
                      </p>
                      <p>
                        <span className="text-[var(--paper)]">HS:</span> {b.hsCode || '—'} ·{' '}
                        <span className="text-[var(--paper)]">Shipments:</span> {b.shipmentEvidence?.shipmentCount || 0}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="rounded bg-[var(--brass)]/15 border border-[var(--brass)]/40 px-2 py-0.5 text-[var(--brass)] font-bold">
                        Match: {b.matchScore}/100
                      </span>
                      <span className="rounded bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 text-emerald-400 font-bold">
                        Lead: {b.leadScore}/100
                      </span>
                    </div>

                    {b.isUnlocked ? (
                      <div className="mt-3 text-[10px] text-emerald-400 border border-emerald-500/30 bg-emerald-950/30 p-2 rounded">
                        <p>✉ {b.email || 'No email on file'}</p>
                        <p>☎ {b.phone || 'No phone on file'}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-[10px] text-[var(--muted)] italic">
                        🔒 Contact details protected (Unlockable)
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--brass)]/15 flex items-center justify-between gap-2">
                    <Link
                      href={`/buyers/${b.id}`}
                      className="text-[10px] text-[var(--brass)] hover:underline uppercase font-bold"
                    >
                      View Profile →
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleSaveLead(b)}
                      disabled={savingLeadId === b.id}
                      className="rounded bg-[var(--brass)] px-3 py-1 font-bold text-[10px] uppercase text-[var(--ink)] hover:brightness-110 disabled:opacity-50"
                    >
                      {savingLeadId === b.id ? 'Saving…' : '+ Save Lead'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink)] p-8 text-center font-mono text-xs text-[var(--muted)]">
              No registered buyer profiles currently matched for HS Code {hsCode} in {targetCountry}. Try expanding commodity search parameters or review adjacent corridors.
            </div>
          )}
        </section>

        {/* Section 12: Export Action Plan (Adaptive Roadmap) */}
        <section className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-2xl space-y-6">
          <div>
            <FieldLabel>Section 12</FieldLabel>
            <h2 className="font-display text-2xl text-[var(--paper)] mt-1">
              Adaptive 10-Step Export Execution Roadmap
            </h2>
            <p className="font-mono text-xs text-[var(--muted)] mt-0.5">
              Practical milestones tailored dynamically to corridor trade risk, readiness, and verified buyer count.
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {analysis?.actionPlan?.map((item) => {
              const statusBadge =
                item.status === 'COMPLETED'
                  ? 'border-emerald-500/50 bg-emerald-950 text-emerald-400'
                  : item.status === 'ACTION_REQUIRED'
                  ? 'border-[var(--brass)] bg-[var(--brass)]/20 text-[var(--brass)] font-bold'
                  : item.status === 'BLOCKED'
                  ? 'border-rose-500/50 bg-rose-950 text-rose-300'
                  : 'border-[var(--muted)]/40 bg-[var(--ink)] text-[var(--muted)]';

              return (
                <div
                  key={item.step}
                  className="rounded-xl border border-[var(--brass)]/15 bg-[var(--ink)] p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-[var(--brass)]/40 transition"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brass)] font-display text-sm font-bold text-[var(--ink)]">
                      {item.step}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-[var(--paper)] text-sm">{item.title}</h4>
                        <span className={`rounded px-2 py-0.2 text-[9px] uppercase tracking-wider border ${statusBadge}`}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[var(--muted)] leading-relaxed">{item.description}</p>
                    </div>
                  </div>

                  {item.link && (
                    <Link
                      href={item.link}
                      className="rounded border border-[var(--brass)]/30 px-3 py-1 text-[10px] uppercase font-bold text-[var(--brass)] hover:border-[var(--brass)] hover:bg-[var(--brass)] hover:text-[var(--ink)] shrink-0 self-end sm:self-center transition"
                    >
                      Open Tool →
                    </Link>
                  )}
                </div>
              );
            }) || <p className="text-[var(--muted)]">Generating execution roadmap…</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ExportPlannerPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="min-h-screen bg-[var(--ink)] p-12 text-center text-[var(--brass)] font-mono">Loading Export Opportunity Planner…</div>}>
        <ExportPlannerContent />
      </Suspense>
    </AuthGuard>
  );
}
