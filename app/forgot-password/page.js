"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--ink-2)] via-[var(--ink)] to-[var(--ink)] px-6 py-14 md:py-20 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] shadow-2xl p-8 md:p-10">
          <Link href="/" className="inline-flex items-center gap-2 font-display text-2xl text-[var(--paper)]">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-[var(--brass)] font-mono text-sm font-bold text-[var(--ink)]">
              GB
            </span>
            <span>
              GLOBE<span className="text-[var(--brass)]">BRIDGE</span>
            </span>
          </Link>

          <h2 className="font-display mt-6 text-2xl text-[var(--paper)]">
            Reset your password
          </h2>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            Enter the email on your GlobeBridge account and we&rsquo;ll send you a link to reset your password.
          </p>

          {message ? (
            <div className="mt-6 rounded border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-3 text-xs text-emerald-300">
              {message}
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[var(--muted)] uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="jordan@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                />
              </div>

              {error && (
                <div className="rounded border border-red-500/40 bg-red-950/40 px-3.5 py-2.5 text-[11px] text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-[var(--brass)] py-3.5 font-mono text-xs uppercase tracking-widest text-[var(--ink)] font-bold hover:brightness-110 shadow-lg transition"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-[var(--brass)]/15 text-center font-mono text-xs text-[var(--muted)]">
            <Link href="/login" className="text-[var(--brass)] font-bold hover:underline">
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
