"use client";

import { useState } from "react";
import FieldLabel from "../../components/FieldLabel";
import Link from "next/link";
import { PRICING_PLANS } from "../../data/tradeData";

export default function PricingPage() {
  const [currency, setCurrency] = useState("INR"); // "INR" | "USD"
  const [billingCycle, setBillingCycle] = useState("annual"); // "semi" | "annual"

  const comparisonRows = [
    { feature: "Harmonized HS Code Search", trial: "10 Searches", growth: "50 / Month", connect: "Unlimited", conquer: "Unlimited" },
    { feature: "Verified Company Profile Views", trial: "10 Views", growth: "50 Views", connect: "200 / Month", conquer: "Unlimited" },
    { feature: "Nexus Supply Chain Mapping", trial: "Basic", growth: "Nexus 1.0", connect: "Nexus 2.0", conquer: "Nexus 2.0 Full" },
    { feature: "Human Verified Decision Contacts", trial: "—", growth: "Instant Verified", connect: "Direct Mobile + Email", conquer: "Full Dossiers" },
    { feature: "Port & Freight Lane Analytics", trial: "—", growth: "Included", connect: "Included", conquer: "Custom Dedicated" },
    { feature: "Competitor Shipment Alerts", trial: "—", growth: "—", connect: "Real-time", conquer: "Real-time + API" },
    { feature: "Raw Shipment Records Downloads", trial: "—", growth: "10,000 Rows", connect: "50,000 Rows", conquer: "1,500,000 Rows" },
    { feature: "Ask a Trade Specialist Calls", trial: "—", growth: "2 Inquiries", connect: "10 Consultations", conquer: "Unlimited Priority" },
    { feature: "Simultaneous Team Logins", trial: "1 Login", growth: "1 Login", connect: "3 Logins", conquer: "5+ Custom Logins" },
    { feature: "Custom API & ERP Integration", trial: "—", growth: "—", connect: "Add-on", conquer: "Included" },
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Header */}
      <section className="border-b border-[var(--brass)]/20 bg-gradient-to-b from-[var(--ink-2)] to-[var(--ink)] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <FieldLabel>Transparent EXIM Intelligence Subscriptions</FieldLabel>
          <h1 className="font-display mx-auto mt-4 max-w-3xl text-4xl text-[var(--paper)] md:text-6xl">
            Choose the right plan to scale your global business.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--muted)] leading-relaxed">
            Gain immediate access to verified international buyers, suppliers, customs manifests, and predictive trade intelligence.
          </p>

          {/* Currency and Billing Controls */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            {/* Currency Toggle */}
            <div className="flex items-center rounded-lg border border-[var(--brass)]/30 bg-[var(--ink)] p-1 font-mono text-xs">
              <button
                onClick={() => setCurrency("INR")}
                className={`rounded px-4 py-1.5 transition ${
                  currency === "INR"
                    ? "bg-[var(--brass)] text-[var(--ink)] font-bold shadow"
                    : "text-[var(--muted)] hover:text-[var(--paper)]"
                }`}
              >
                ₹ INR (India)
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`rounded px-4 py-1.5 transition ${
                  currency === "USD"
                    ? "bg-[var(--brass)] text-[var(--ink)] font-bold shadow"
                    : "text-[var(--muted)] hover:text-[var(--paper)]"
                }`}
              >
                $ USD (Global)
              </button>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center gap-2 font-mono text-xs text-[var(--muted)]">
              <button
                onClick={() => setBillingCycle("semi")}
                className={`transition ${billingCycle === "semi" ? "text-[var(--brass)] font-bold underline" : "hover:text-[var(--paper)]"}`}
              >
                6 Months
              </button>
              <span>/</span>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`transition ${billingCycle === "annual" ? "text-[var(--brass)] font-bold underline" : "hover:text-[var(--paper)]"}`}
              >
                Annual (12 Months)
              </button>
              <span className="rounded bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 text-[10px] text-emerald-400">
                Save up to 25%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PRICING_PLANS.map((plan) => {
              const displayPrice =
                currency === "INR"
                  ? plan.priceInrAnnual === 0
                    ? "₹0"
                    : `₹${plan.priceInrAnnual.toLocaleString()}`
                  : plan.priceUsdAnnual === 0
                  ? "$0"
                  : `$${plan.priceUsdAnnual.toLocaleString()}`;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-xl border p-6 transition ${
                    plan.highlight
                      ? "border-[var(--brass)] bg-[var(--ink-2)] shadow-2xl ring-2 ring-[var(--brass)]/50"
                      : "border-[var(--brass)]/25 bg-[var(--ink)] hover:border-[var(--brass)]"
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--brass)] px-3 py-0.5 font-mono text-[10px] uppercase font-bold text-[var(--ink)] tracking-wider">
                      ★ Most Popular
                    </span>
                  )}

                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--brass)]">
                      {plan.badge}
                    </span>
                    <h3 className="font-display mt-1 text-2xl text-[var(--paper)]">
                      {plan.name}
                    </h3>
                    <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                      {plan.description}
                    </p>

                    <div className="mt-6 border-t border-b border-[var(--brass)]/20 py-4">
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-4xl font-bold text-[var(--paper)]">
                          {displayPrice}
                        </span>
                        {plan.priceInrAnnual > 0 && (
                          <span className="font-mono text-[10px] text-[var(--muted)] uppercase">
                            / {billingCycle === "annual" ? "Year" : "6 Mos"}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-[var(--muted)]">
                        {plan.periodText}
                      </p>
                    </div>

                    <div className="mt-6 space-y-2.5 font-mono text-xs">
                      <p className="text-[11px] uppercase tracking-wider text-[var(--brass)]">Features Included:</p>
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[var(--paper)]">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-4">
                    <Link
                      href={plan.ctaLink}
                      className={`block w-full rounded py-3 text-center font-mono text-xs uppercase tracking-widest font-bold transition ${
                        plan.highlight
                          ? "bg-[var(--brass)] text-[var(--ink)] hover:brightness-110 shadow-lg"
                          : "border border-[var(--brass)] text-[var(--brass)] hover:bg-[var(--brass)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {plan.ctaText}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison Matrix */}
      <section className="border-t border-[var(--brass)]/20 bg-[var(--ink-2)] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <FieldLabel>Detailed Feature Matrix</FieldLabel>
          <h2 className="font-display text-3xl text-[var(--paper)] md:text-4xl">
            Compare subscription capabilities
          </h2>

          <div className="mt-10 overflow-x-auto rounded-xl border border-[var(--brass)]/30 bg-[var(--ink)]">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-[var(--brass)]/25 bg-[var(--ink-2)] text-[var(--brass)] uppercase">
                <tr>
                  <th className="p-4">Platform Feature</th>
                  <th className="p-4 text-center">Free Explorer</th>
                  <th className="p-4 text-center text-[var(--brass)]">Growth</th>
                  <th className="p-4 text-center">Connect Pro</th>
                  <th className="p-4 text-center">Conquer Suite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--brass)]/15 text-[var(--paper)]">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[var(--ink-2)]/40 transition">
                    <td className="p-4 font-semibold">{row.feature}</td>
                    <td className="p-4 text-center text-[var(--muted)]">{row.trial}</td>
                    <td className="p-4 text-center font-bold text-[var(--brass)]">{row.growth}</td>
                    <td className="p-4 text-center text-emerald-400">{row.connect}</td>
                    <td className="p-4 text-center text-sky-400 font-bold">{row.conquer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <FieldLabel>Frequently Asked Questions</FieldLabel>
          <h2 className="font-display text-3xl text-[var(--paper)]">
            Subscription &amp; Licensing Queries
          </h2>

          <div className="mt-8 space-y-4 font-mono text-xs">
            <div className="rounded-lg border border-[var(--brass)]/20 bg-[var(--ink-2)] p-5">
              <h4 className="text-sm font-bold text-[var(--paper)]">How often is the EXIM shipment data updated?</h4>
              <p className="mt-2 text-[var(--muted)] leading-relaxed">
                Our AI data ingestion pipelines update customs manifests daily for major sea and air ports across 181+ countries, ensuring you never reach out to inactive buyers.
              </p>
            </div>

            <div className="rounded-lg border border-[var(--brass)]/20 bg-[var(--ink-2)] p-5">
              <h4 className="text-sm font-bold text-[var(--paper)]">Can I get a GST tax invoice for business expense deduction?</h4>
              <p className="mt-2 text-[var(--muted)] leading-relaxed">
                Yes, full tax invoices with GSTIN details are automatically generated for all Indian and overseas entities, eligible for input tax credit.
              </p>
            </div>

            <div className="rounded-lg border border-[var(--brass)]/20 bg-[var(--ink-2)] p-5">
              <h4 className="text-sm font-bold text-[var(--paper)]">What is the difference between Nexus 1.0 and Nexus 2.0?</h4>
              <p className="mt-2 text-[var(--muted)] leading-relaxed">
                Nexus 1.0 maps single-tier direct buyer-seller links. Nexus 2.0 provides multi-tier supply chain visualization including sub-tier component suppliers, inland haulage logistics, and competitor alternative sourcing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
