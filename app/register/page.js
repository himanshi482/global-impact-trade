"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import FieldLabel from "../../components/FieldLabel";

export default function RegisterPage() {
  const { register } = useAuth();
  const [businessType, setBusinessType] = useState("Manufacturer Exporter");
  const [formData, setFormData] = useState({
    fullName: "",
    designation: "Managing Director / Partner",
    email: "",
    phone: "",
    companyName: "",
    country: "India",
    iecCode: "",
    productCategory: "Agricultural & Spices (Ch 06-24)",
    password: "",
    confirmPassword: "",
    agreeTerms: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please check and re-enter.");
      return;
    }
    if (!formData.agreeTerms) {
      setError("Please agree to the Terms of Use to continue.");
      return;
    }

    setLoading(true);
    const result = await register({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      companyName: formData.companyName,
      country: formData.country,
      industry: formData.productCategory,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error || "Registration failed. Please try again.");
    }
    // On success, register() itself navigates to /dashboard.
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--ink-2)] via-[var(--ink)] to-[var(--ink)] px-6 py-14 md:py-20 flex items-center justify-center">
      <div className="w-full max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-12 rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] shadow-2xl overflow-hidden">
          
          {/* Left Column: Value Prop */}
          <div className="lg:col-span-4 bg-gradient-to-br from-[var(--ink)] to-[var(--ink-2)] p-8 border-b lg:border-b-0 lg:border-r border-[var(--brass)]/20 flex flex-col justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 font-display text-2xl text-[var(--paper)]">
                <span className="flex h-8 w-8 items-center justify-center rounded bg-[var(--brass)] font-mono text-sm font-bold text-[var(--ink)]">
                  GB
                </span>
                <span>
                  GLOBE<span className="text-[var(--brass)]">BRIDGE</span>
                </span>
              </Link>

              <div className="mt-8">
                <span className="inline-block rounded-full bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
                  ★ 7-Day Free Explorer Trial
                </span>
                <h2 className="font-display mt-3 text-2xl md:text-3xl text-[var(--paper)]">
                  Start Discovering Global Buyers in 60 Seconds.
                </h2>
                <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
                  Join 45,000+ exporters and importers using GlobeBridge EXIM intelligence to grow overseas contracts with verified counterparties.
                </p>
              </div>

              <div className="mt-8 space-y-3 font-mono text-xs text-[var(--paper)]">
                <div className="rounded-lg bg-[var(--ink)]/80 p-3 border border-[var(--brass)]/15">
                  <p className="text-[var(--brass)] font-bold">✓ 10 Free Profile Unlocks</p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">Verified emails and mobile contacts of active importers.</p>
                </div>
                <div className="rounded-lg bg-[var(--ink)]/80 p-3 border border-[var(--brass)]/15">
                  <p className="text-[var(--brass)] font-bold">✓ 181+ Country Access</p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">Real-time bills of lading and shipment weight records.</p>
                </div>
                <div className="rounded-lg bg-[var(--ink)]/80 p-3 border border-[var(--brass)]/15">
                  <p className="text-[var(--brass)] font-bold">✓ No Credit Card Required</p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">Instant activation for registered trade businesses.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--brass)]/15 font-mono text-xs text-[var(--muted)]">
              Already registered?{" "}
              <Link href="/login" className="text-[var(--brass)] font-bold hover:underline">
                Sign in here →
              </Link>
            </div>
          </div>

          {/* Right Column: Registration Form */}
          <div className="lg:col-span-8 p-8 md:p-10 flex flex-col justify-center">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--brass)]">
                Enterprise Registration
              </span>
              <h2 className="font-display mt-1 text-2xl md:text-3xl text-[var(--paper)]">
                Create Your EXIM Account
              </h2>

              <form noValidate onSubmit={handleRegister} className="mt-6 space-y-4 font-mono text-xs">
                {/* Business Type selector */}
                <div>
                  <label className="block text-[var(--muted)] uppercase tracking-wider mb-1">
                    Business Entity Type *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      "Manufacturer Exporter",
                      "Merchant Exporter",
                      "Foreign Importer",
                      "Freight Forwarder"
                    ].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setBusinessType(t)}
                        className={`rounded border p-2 text-center text-[10px] transition ${
                          businessType === t
                            ? "border-[var(--brass)] bg-[var(--ink)] text-[var(--brass)] font-bold shadow"
                            : "border-[var(--brass)]/20 bg-[var(--ink)]/40 text-[var(--muted)] hover:border-[var(--brass)]/40"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name and Designation */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jordan Rao"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Designation</label>
                    <input
                      type="text"
                      placeholder="Managing Director / Partner"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Work / Business Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="jordan@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Mobile / WhatsApp (+Country Code) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 94915 81000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                    />
                  </div>
                </div>

                {/* Company Name & Country */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[var(--muted)] uppercase mb-1">Company / Firm Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Global Exports Pvt Ltd"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">IEC / Tax ID (Opt.)</label>
                    <input
                      type="text"
                      placeholder="0519028123"
                      value={formData.iecCode}
                      onChange={(e) => setFormData({ ...formData, iecCode: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                    />
                  </div>
                </div>

                {/* Product Category */}
                <div>
                  <label className="block text-[var(--muted)] uppercase mb-1">Primary Export/Import Product Category *</label>
                  <select
                    value={formData.productCategory}
                    onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none"
                  >
                    <option>Agricultural, Spices &amp; Coffee (Ch 06-24)</option>
                    <option>Textiles, Apparel &amp; Handlooms (Ch 50-63)</option>
                    <option>Chemicals, APIs &amp; Pharma (Ch 28-38)</option>
                    <option>Engineering Goods &amp; Machinery (Ch 84-85)</option>
                    <option>Ceramics, Tiles &amp; Stones (Ch 68-70)</option>
                    <option>Gems, Jewellery &amp; Metals (Ch 71-73)</option>
                    <option>Plastics, Rubber &amp; Leather (Ch 39-43)</option>
                  </select>
                </div>

                {/* Passwords */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Create Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                    />
                  </div>
                </div>

                {/* Terms */}
                <div className="pt-2">
                  <label className="flex items-start gap-2 cursor-pointer text-[var(--muted)]">
                    <input
                      type="checkbox"
                      required
                      checked={formData.agreeTerms}
                      onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                      className="accent-[var(--brass)] mt-0.5"
                    />
                    <span>
                      I agree to GlobeBridge EXIM <Link href="/contact" className="text-[var(--brass)] underline">Terms of Use</Link> and certify that data will be utilized for legitimate international trade.
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="rounded border border-red-500/40 bg-red-950/40 px-3.5 py-2.5 text-[11px] text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded bg-[var(--brass)] py-3.5 font-mono text-xs uppercase tracking-widest text-[var(--ink)] font-bold hover:brightness-110 shadow-lg transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Activating &amp; Launching EXIM App...</span>
                  ) : (
                    <span>Register &amp; Launch EXIM App →</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
