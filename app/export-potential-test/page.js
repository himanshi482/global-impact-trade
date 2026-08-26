"use client";

import { useState } from "react";
import FieldLabel from "../../components/FieldLabel";
import Link from "next/link";
import AuthGuard from "../../components/AuthGuard";
import { ASSESSMENT_QUESTIONS } from "../../data/tradeData";

export default function ExportPotentialTestPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [productCategory, setProductCategory] = useState("Spices & Agri Products");
  const [targetRegion, setTargetRegion] = useState("Middle East / GCC");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isCalculated, setIsCalculated] = useState(false);

  const totalQuestions = ASSESSMENT_QUESTIONS.length;

  const handleSelectOption = (questionId, score) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }));
  };

  const handleNext = () => {
    if (currentStep < totalQuestions - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCalculated(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    setIsCalculated(false);
  };

  // Calculate score out of 100
  const totalScore = Object.values(answers).reduce((acc, curr) => acc + curr, 0);

  const getScoreGrade = (score) => {
    if (score >= 80) return { grade: "Tier 1: Global Export Ready", color: "text-emerald-400", bg: "bg-emerald-950/60 border-emerald-500/40", desc: "Your enterprise possesses strong production capacity, regulatory compliance, and market clarity. You are primed to onboard international buyers immediately." };
    if (score >= 55) return { grade: "Tier 2: High Growth Potential", color: "text-[var(--brass)]", bg: "bg-[var(--brass)]/10 border-[var(--brass)]/40", desc: "Good baseline readiness. With minor adjustments to target market customs compliance and packing standardization, you can unlock key overseas contracts." };
    return { grade: "Tier 3: Incubation & Capability Building", color: "text-amber-400", bg: "bg-amber-950/60 border-amber-500/40", desc: "You have a viable product but need statutory export licenses (IEC, RCMC), lab standardization, and competitor price benchmarking before shipping large containers." };
  };

  const resultGrade = getScoreGrade(totalScore);

  return (
    <AuthGuard>
      <main className="min-h-screen">
      {/* Hero Header */}
      <section className="border-b border-[var(--brass)]/20 bg-gradient-to-b from-[var(--ink-2)] to-[var(--ink)] px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brass)]/40 bg-[var(--brass)]/10 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-[var(--brass)]">
            AI Trade Readiness Assessment
          </span>
          <h1 className="font-display mt-4 text-4xl text-[var(--paper)] md:text-5xl">
            Export Potential &amp; Readiness Test
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-[var(--muted)] leading-relaxed md:text-base">
            Evaluate your export competitiveness across management dedication, product standards, market demand, and customs compliance. Get an instant score and bespoke roadmap.
          </p>
        </div>
      </section>

      {/* Main Assessment Container */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-4xl">
          {!isCalculated ? (
            <div className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-2xl md:p-10">
              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex justify-between font-mono text-xs text-[var(--muted)] mb-2">
                  <span>Step {currentStep + 1} of {totalQuestions}</span>
                  <span className="text-[var(--brass)] font-bold">
                    {Math.round(((currentStep + 1) / totalQuestions) * 100)}% Completed
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--ink)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--brass)] transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Preliminary Category select on Step 0 */}
              {currentStep === 0 && (
                <div className="mb-8 grid gap-4 sm:grid-cols-2 rounded-lg bg-[var(--ink)] p-4 border border-[var(--brass)]/15">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-[var(--brass)]">
                      Primary Industry / Product Line
                    </label>
                    <select
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className="mt-1.5 w-full rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3 py-2 font-mono text-xs text-[var(--paper)] focus:outline-none"
                    >
                      <option>Spices &amp; Agri Products</option>
                      <option>Textiles, Garments &amp; Apparel</option>
                      <option>Handicrafts &amp; Home Decor</option>
                      <option>Chemicals, APIs &amp; Pharma</option>
                      <option>Engineering Goods &amp; Machinery</option>
                      <option>Ceramics, Tiles &amp; Stones</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-[var(--brass)]">
                      Target Geographical Market
                    </label>
                    <select
                      value={targetRegion}
                      onChange={(e) => setTargetRegion(e.target.value)}
                      className="mt-1.5 w-full rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3 py-2 font-mono text-xs text-[var(--paper)] focus:outline-none"
                    >
                      <option>Middle East / GCC (UAE, Saudi, Oman)</option>
                      <option>European Union &amp; UK</option>
                      <option>North America (USA &amp; Canada)</option>
                      <option>Southeast Asia &amp; ASEAN</option>
                      <option>Africa &amp; Latin America</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Current Question */}
              {(() => {
                const q = ASSESSMENT_QUESTIONS[currentStep];
                return (
                  <div>
                    <span className="font-mono text-xs uppercase tracking-widest text-[var(--brass)]">
                      Category: {q.category}
                    </span>
                    <h2 className="font-display mt-2 text-2xl text-[var(--paper)] md:text-3xl">
                      {q.title}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                      {q.description}
                    </p>

                    {/* Options */}
                    <div className="mt-6 space-y-3">
                      {q.options.map((opt, idx) => {
                        const isSelected = answers[q.id] === opt.score;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectOption(q.id, opt.score)}
                            className={`flex w-full items-center justify-between rounded-lg border p-4 text-left font-mono text-xs transition ${
                              isSelected
                                ? "border-[var(--brass)] bg-[var(--ink)] text-[var(--paper)] shadow-md ring-1 ring-[var(--brass)]"
                                : "border-[var(--brass)]/20 bg-[var(--ink)]/50 text-[var(--muted)] hover:border-[var(--brass)]/60 hover:text-[var(--paper)]"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                                  isSelected
                                    ? "border-[var(--brass)] bg-[var(--brass)] text-[var(--ink)] font-bold"
                                    : "border-[var(--muted)]"
                                }`}
                              >
                                {isSelected ? "✓" : String.fromCharCode(65 + idx)}
                              </span>
                              <span>{opt.text}</span>
                            </span>
                            <span className="font-mono text-[10px] text-[var(--brass)] font-semibold">
                              +{opt.score} pts
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Navigation Controls */}
              <div className="mt-8 flex items-center justify-between border-t border-[var(--brass)]/20 pt-6">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className={`rounded border border-[var(--brass)]/30 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-[var(--paper)] transition ${
                    currentStep === 0 ? "opacity-30 cursor-not-allowed" : "hover:border-[var(--brass)] hover:text-[var(--brass)]"
                  }`}
                >
                  ← Previous
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={answers[ASSESSMENT_QUESTIONS[currentStep].id] === undefined}
                  className={`rounded bg-[var(--brass)] px-7 py-2.5 font-mono text-xs uppercase tracking-widest text-[var(--ink)] font-bold transition ${
                    answers[ASSESSMENT_QUESTIONS[currentStep].id] === undefined
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:brightness-110 shadow-lg"
                  }`}
                >
                  {currentStep === totalQuestions - 1 ? "Generate Assessment Report →" : "Next Step →"}
                </button>
              </div>
            </div>
          ) : (
            /* Results Screen */
            <div className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-2xl md:p-10">
              <div className="text-center">
                <span className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-400">
                  Assessment Verified · Evaluation Complete
                </span>
                <h2 className="font-display mt-3 text-3xl text-[var(--paper)] md:text-4xl">
                  Your Export Potential Score: <span className="text-[var(--brass)]">{totalScore} / 100</span>
                </h2>
              </div>

              {/* Grade Badge */}
              <div className={`mt-6 rounded-lg p-6 border text-center ${resultGrade.bg}`}>
                <h3 className={`font-display text-2xl font-bold ${resultGrade.color}`}>
                  {resultGrade.grade}
                </h3>
                <p className="mt-2 text-xs text-[var(--paper)] max-w-xl mx-auto leading-relaxed">
                  {resultGrade.desc}
                </p>
              </div>

              {/* Recommended Markets & Insights */}
              <div className="mt-8 grid gap-6 md:grid-cols-2 font-mono text-xs">
                <div className="rounded-lg bg-[var(--ink)] p-5 border border-[var(--brass)]/20">
                  <h4 className="text-[var(--brass)] uppercase tracking-wider font-bold mb-3">
                    🌍 Top High-Demand Target Markets
                  </h4>
                  <ul className="space-y-2 text-[var(--paper)]">
                    <li className="flex justify-between border-b border-[var(--brass)]/10 pb-1.5">
                      <span>1. United Arab Emirates &amp; GCC</span>
                      <span className="text-emerald-400">0% Custom Duty (CEPA)</span>
                    </li>
                    <li className="flex justify-between border-b border-[var(--brass)]/10 pb-1.5">
                      <span>2. European Union (Germany, Netherlands)</span>
                      <span className="text-emerald-400">High Organic Premium</span>
                    </li>
                    <li className="flex justify-between border-b border-[var(--brass)]/10 pb-1.5">
                      <span>3. United States (West &amp; East Coast)</span>
                      <span className="text-emerald-400">Large Volume Orders</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg bg-[var(--ink)] p-5 border border-[var(--brass)]/20">
                  <h4 className="text-[var(--brass)] uppercase tracking-wider font-bold mb-3">
                    📋 Statutory Export Checklist
                  </h4>
                  <ul className="space-y-2 text-[var(--paper)]">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> Valid Import Export Code (IEC)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> Registration-cum-Membership (RCMC)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> RoDTEP / Duty Drawback Eligibility
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> Verified Phytosanitary / Quality Certs
                    </li>
                  </ul>
                </div>
              </div>

              {/* Consultation / Lead Request */}
              <div className="mt-8 rounded-lg bg-[var(--ink)] p-6 border border-[var(--brass)]/30">
                <h4 className="font-display text-xl text-[var(--paper)]">
                  Receive Your Full 12-Page Export Intelligence Dossier
                </h4>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Includes buyer directory for {productCategory}, import duty tables, and 30 minutes free 1-on-1 strategy call with our senior trade advisor.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert("Thank you! Your customized Export Potential Report and consultation link have been emailed to " + email);
                  }}
                  className="mt-4 grid gap-3 sm:grid-cols-3"
                >
                  <input
                    type="text"
                    required
                    placeholder="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3 py-2.5 font-mono text-xs text-[var(--paper)] focus:outline-none"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Business Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3 py-2.5 font-mono text-xs text-[var(--paper)] focus:outline-none"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="WhatsApp Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3 py-2.5 font-mono text-xs text-[var(--paper)] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-3 rounded bg-[var(--brass)] py-3 font-mono text-xs uppercase tracking-widest text-[var(--ink)] font-bold hover:brightness-110"
                  >
                    Email Me The Complete Dossier &amp; Book Strategy Call
                  </button>
                </form>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="font-mono text-xs text-[var(--muted)] hover:text-[var(--brass)] underline"
                >
                  ↺ Retake Test With Different Product
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  </AuthGuard>
);
}
