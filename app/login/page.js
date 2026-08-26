"use client";

import { useState } from "react";
import Link from "next/link";
import FieldLabel from "../../components/FieldLabel";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [role, setRole] = useState("exporter"); // "exporter" | "agent"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login({ email, password });
    setLoading(false);
    if (!result.ok) {
      setError(result.error || "Login failed. Please try again.");
    }
    // On success, login() itself navigates to /dashboard.
  };

  const handleQuickDemo = (demoType) => {
    if (demoType === "exporter") {
      setEmail("admin@globebridge.dev");
      setPassword("Admin@12345");
    } else {
      setEmail("admin@globebridge.dev");
      setPassword("Admin@12345");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--ink-2)] via-[var(--ink)] to-[var(--ink)] px-6 py-14 md:py-20 flex items-center justify-center">
      <div className="w-full max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-12 rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] shadow-2xl overflow-hidden">
          
          {/* Left Visual Column */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[var(--ink)] to-[var(--ink-2)] p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-[var(--brass)]/20 flex flex-col justify-between">
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
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--brass)]">
                  EXIM Cloud Portal
                </span>
                <h2 className="font-display mt-2 text-2xl md:text-3xl text-[var(--paper)]">
                  Sign in to your Trade Intelligence Dashboard.
                </h2>
                <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
                  Access 23Mn+ verified global company profiles, real-time customs shipment manifests, and Nexus 2.0 multi-tier supply chain insights.
                </p>
              </div>

              <div className="mt-8 space-y-3 font-mono text-xs text-[var(--paper)]">
                <div className="flex items-center gap-2.5 rounded-lg bg-[var(--ink)]/80 p-3 border border-[var(--brass)]/15">
                  <span className="text-emerald-400">✓</span>
                  <span>181+ Reporting Countries Active</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg bg-[var(--ink)]/80 p-3 border border-[var(--brass)]/15">
                  <span className="text-emerald-400">✓</span>
                  <span>Daily Refreshed Port Bills of Lading</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg bg-[var(--ink)]/80 p-3 border border-[var(--brass)]/15">
                  <span className="text-emerald-400">✓</span>
                  <span>Direct Decision-Maker Contacts</span>
                </div>
              </div>
            </div>

            {/* Quick Demo Credentials */}
            <div className="mt-8 pt-6 border-t border-[var(--brass)]/15">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--brass)] font-bold">
                Instant Demo Autofill:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo("exporter")}
                  className="rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-2.5 py-1 font-mono text-[10px] text-[var(--paper)] hover:border-[var(--brass)] hover:text-[var(--brass)]"
                >
                  ⚡ Fill as Exporter
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("buyer")}
                  className="rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-2.5 py-1 font-mono text-[10px] text-[var(--paper)] hover:border-[var(--brass)] hover:text-[var(--brass)]"
                >
                  ⚡ Fill as Foreign Buyer
                </button>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7 p-8 md:p-10 flex flex-col justify-center">
            <div>
              {/* Account Type Selector */}
              <div className="flex rounded-lg bg-[var(--ink)] p-1 border border-[var(--brass)]/20 mb-6">
                <button
                  type="button"
                  onClick={() => setRole("exporter")}
                  className={`flex-1 rounded py-2 font-mono text-xs uppercase tracking-wider transition ${
                    role === "exporter"
                      ? "bg-[var(--brass)] font-bold text-[var(--ink)] shadow"
                      : "text-[var(--muted)] hover:text-[var(--paper)]"
                  }`}
                >
                  🚢 Exporter / Importer
                </button>
                <button
                  type="button"
                  onClick={() => setRole("agent")}
                  className={`flex-1 rounded py-2 font-mono text-xs uppercase tracking-wider transition ${
                    role === "agent"
                      ? "bg-[var(--brass)] font-bold text-[var(--ink)] shadow"
                      : "text-[var(--muted)] hover:text-[var(--paper)]"
                  }`}
                >
                  🏢 Freight / Customs Agent
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-[var(--muted)] uppercase tracking-wider mb-1">
                    Business Email or IEC Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. trade@company.com or 0519028123"
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-4 py-3 text-[var(--paper)] placeholder:text-[var(--muted)]/50 focus:border-[var(--brass)] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[var(--muted)] uppercase tracking-wider">
                      Password *
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[10px] text-[var(--brass)] hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-4 py-3 pr-10 text-[var(--paper)] placeholder:text-[var(--muted)]/50 focus:border-[var(--brass)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[var(--muted)] hover:text-[var(--paper)]"
                    >
                      {showPassword ? "👁️" : "🔒"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--muted)]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-[var(--brass)]"
                    />
                    <span>Remember this workstation for 30 days</span>
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
                    <span>Authenticating &amp; Opening App...</span>
                  ) : (
                    <span>Sign In &amp; Open EXIM App →</span>
                  )}
                </button>
              </form>

              {/* Switch to Register */}
              <div className="mt-8 border-t border-[var(--brass)]/15 pt-6 text-center font-mono text-xs text-[var(--muted)]">
                Don&rsquo;t have an active EXIM license?{" "}
                <Link
                  href="/register"
                  className="font-bold text-[var(--brass)] underline underline-offset-4 hover:text-[var(--paper)]"
                >
                  Register for Free 7-Day Trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
