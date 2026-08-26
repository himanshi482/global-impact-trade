"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("This reset link is missing its token. Request a new one.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setMessage(data.message);
        setTimeout(() => router.push("/login"), 2000);
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
            Set a new password
          </h2>

          {!token && (
            <p className="mt-3 text-xs text-red-300">
              No reset token found in this link. Request a new one from the{" "}
              <Link href="/forgot-password" className="underline text-[var(--brass)]">
                forgot password
              </Link>{" "}
              page.
            </p>
          )}

          {message ? (
            <div className="mt-6 rounded border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-3 text-xs text-emerald-300">
              {message} Redirecting to sign in...
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[var(--muted)] uppercase tracking-wider mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                />
              </div>
              <div>
                <label className="block text-[var(--muted)] uppercase tracking-wider mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                disabled={loading || !token}
                className="w-full rounded bg-[var(--brass)] py-3.5 font-mono text-xs uppercase tracking-widest text-[var(--ink)] font-bold hover:brightness-110 shadow-lg transition disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
