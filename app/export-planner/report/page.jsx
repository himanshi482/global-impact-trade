'use client';

// app/export-planner/report/page.jsx
// Stage 3 Phase 3 — Printable Trade Intelligence Report

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ExportPlannerReportPage() {
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('gb_current_export_plan');
      if (stored) {
        Promise.resolve(JSON.parse(stored)).then(setAnalysis);
      }
    } catch {}
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!analysis) {
    return (
      <main className="min-h-screen bg-[var(--ink)] p-12 text-center font-mono text-xs text-[var(--paper)]">
        <p className="text-amber-400 mb-4">No cached intelligence dossier found.</p>
        <Link
          href="/export-planner"
          className="rounded bg-[var(--brass)] px-4 py-2 font-bold text-[var(--ink)]"
        >
          Return to Export Planner →
        </Link>
      </main>
    );
  }

  const { inputs, scores, opportunityBreakdown, riskAssessment, landedCost, readinessAssessment, recommendation, recommendedBuyers, actionPlan, marketMetrics } = analysis;

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 sm:p-8 print:bg-white print:text-black print:p-0">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Top Action Bar (hidden when printing) */}
        <div className="flex items-center justify-between bg-neutral-800 p-4 rounded-xl print:hidden">
          <Link href="/export-planner" className="text-xs text-amber-400 hover:underline">
            ← Back to Planner
          </Link>
          <button
            onClick={handlePrint}
            className="rounded bg-amber-500 px-5 py-2 text-xs font-bold text-black hover:bg-amber-400 shadow"
          >
            🖨 Print / Save as PDF
          </button>
        </div>

        {/* Dossier Header */}
        <header className="border-b-2 border-neutral-700 pb-6 print:border-black">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] tracking-widest uppercase font-mono text-amber-400 print:text-neutral-600">
                GlobeBridge Trade Intelligence Platform · Export Decision Dossier
              </span>
              <h1 className="text-3xl font-bold mt-1 text-white print:text-black">
                {inputs?.product || 'Commodity'} Export Opportunity Report
              </h1>
              <p className="text-xs text-neutral-400 font-mono mt-1 print:text-neutral-600">
                Corridor: <strong>{inputs?.originCountry || 'India'}</strong> → <strong>{inputs?.targetCountry || 'Global'}</strong> · HS Code: <strong>{inputs?.hsCode}</strong>
              </p>
            </div>

            <div className="text-right font-mono">
              <span className="text-[10px] uppercase text-neutral-400 block print:text-neutral-600">Opportunity Score</span>
              <span className="text-4xl font-bold text-amber-400 print:text-black">
                {scores?.finalOpportunityScore}/100
              </span>
            </div>
          </div>
        </header>

        {/* Executive Summary & Recommendation */}
        <section className="bg-neutral-800/80 p-5 rounded-xl border border-neutral-700 print:bg-neutral-100 print:border-neutral-300 print:text-black space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 print:text-black">
              1. Executive Strategic Verdict
            </h2>
            <span className="px-3 py-1 rounded text-xs font-bold uppercase border border-neutral-600 print:border-black">
              {recommendation?.decision?.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="text-xs space-y-1 leading-relaxed">
            {recommendation?.reasons?.map((r, i) => (
              <p key={i}>• {r}</p>
            ))}
          </div>
        </section>

        {/* Intelligence Metrics & Risk Benchmark */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-neutral-800 p-3 rounded-lg border border-neutral-700 print:bg-white print:border-neutral-300">
            <span className="text-[10px] text-neutral-400 uppercase block print:text-neutral-600">Market Score</span>
            <strong className="text-xl text-white print:text-black">{scores?.marketOpportunityScore}/100</strong>
          </div>
          <div className="bg-neutral-800 p-3 rounded-lg border border-neutral-700 print:bg-white print:border-neutral-300">
            <span className="text-[10px] text-neutral-400 uppercase block print:text-neutral-600">Export Readiness</span>
            <strong className="text-xl text-emerald-400 print:text-black">{scores?.exportReadinessScore}/100</strong>
          </div>
          <div className="bg-neutral-800 p-3 rounded-lg border border-neutral-700 print:bg-white print:border-neutral-300">
            <span className="text-[10px] text-neutral-400 uppercase block print:text-neutral-600">Corridor Risk</span>
            <strong className="text-xl text-amber-400 print:text-black">{riskAssessment?.level} ({riskAssessment?.score}/100)</strong>
          </div>
          <div className="bg-neutral-800 p-3 rounded-lg border border-neutral-700 print:bg-white print:border-neutral-300">
            <span className="text-[10px] text-neutral-400 uppercase block print:text-neutral-600">Cataloged Importers</span>
            <strong className="text-xl text-white print:text-black">{marketMetrics?.buyerCount ?? 0} ({marketMetrics?.verifiedBuyerCount ?? 0} verified)</strong>
          </div>
        </section>

        {/* Commercial Landed Cost Economics */}
        <section className="border border-neutral-700 p-4 rounded-xl print:border-neutral-300 space-y-2 text-xs font-mono">
          <h3 className="font-bold text-sm uppercase text-amber-400 print:text-black">
            2. Landed Cost & Tariff Schedule Analysis
          </h3>
          {landedCost?.available ? (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between">
                <span className="text-neutral-400 print:text-neutral-600">Assessable Product Cost ({inputs?.quantity} units):</span>
                <span>${landedCost.productCost?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 print:text-neutral-600">Freight & Cargo Insurance:</span>
                <span>${(landedCost.shipping + landedCost.insurance)?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 print:text-neutral-600">Calculated Customs Duty (BCD {landedCost.customsDuty?.rates?.bcd}, IGST {landedCost.customsDuty?.rates?.igst}):</span>
                <span>${landedCost.customsDuty?.total?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-700 pt-1 print:border-black font-bold">
                <span>Estimated Total Landed Cost:</span>
                <span className="text-amber-400 print:text-black">${landedCost.totalLandedCost?.toLocaleString()} (${landedCost.costPerUnit}/unit)</span>
              </div>
              {landedCost.marginPercentage !== null && (
                <div className="flex justify-between text-emerald-400 print:text-black font-bold">
                  <span>Projected Export Margin:</span>
                  <span>{landedCost.marginPercentage}% (${landedCost.estimatedMargin?.toLocaleString()} net)</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-neutral-400 print:text-neutral-600">
              Statutory tariff schedules not available in internal repository for HS Code {inputs?.hsCode}. Base landed cost without destination import duty: <strong>${landedCost?.totalLandedCost?.toLocaleString()}</strong>.
            </p>
          )}
        </section>

        {/* Top Recommended Buyers */}
        <section className="border border-neutral-700 p-4 rounded-xl print:border-neutral-300 space-y-3 text-xs font-mono">
          <h3 className="font-bold text-sm uppercase text-amber-400 print:text-black">
            3. Target Buyer Entities in {inputs?.targetCountry}
          </h3>
          {recommendedBuyers && recommendedBuyers.length > 0 ? (
            <div className="divide-y divide-neutral-700 print:divide-neutral-300">
              {recommendedBuyers.map((b) => (
                <div key={b.id} className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white print:text-black">{b.companyName}</span>
                    {b.verified && <span className="ml-2 text-[10px] text-emerald-400 print:text-black">[Verified]</span>}
                    <p className="text-[10px] text-neutral-400 print:text-neutral-600">{b.city ? `${b.city}, ` : ''}{b.country} · Manifests: {b.shipmentEvidence?.shipmentCount || 0}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 print:text-black font-bold">Match: {b.matchScore}/100</span>
                    <span className="text-[10px] text-neutral-400 block print:text-neutral-600">Lead Score: {b.leadScore}/100</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-400 print:text-neutral-600">No registered buyers in this corridor.</p>
          )}
        </section>

        {/* Execution Roadmap */}
        <section className="border border-neutral-700 p-4 rounded-xl print:border-neutral-300 space-y-2 text-xs font-mono">
          <h3 className="font-bold text-sm uppercase text-amber-400 print:text-black">
            4. Tailored Export Action Plan
          </h3>
          <div className="space-y-2">
            {actionPlan?.slice(0, 5).map((step) => (
              <div key={step.step} className="flex items-start gap-2">
                <span className="font-bold text-amber-400 print:text-black">[{step.step}]</span>
                <div>
                  <strong className="text-white print:text-black">{step.title}</strong>
                  <p className="text-neutral-400 print:text-neutral-600 text-[11px]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-[10px] font-mono text-neutral-500 print:text-neutral-600 border-t border-neutral-800 pt-4 print:border-black">
          GlobeBridge EXIM Trade Intelligence Platform · Report Generated: {new Date().toLocaleDateString()} · Confidential Commercial Intelligence
        </footer>
      </div>
    </div>
  );
}
