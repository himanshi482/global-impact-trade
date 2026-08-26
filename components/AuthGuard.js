"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ink)] flex items-center justify-center p-6">
        <div className="flex items-center gap-3 font-mono text-xs text-[var(--brass)]">
          <span className="h-4 w-4 rounded-full border-2 border-[var(--brass)] border-t-transparent animate-spin"></span>
          <span>Verifying EXIM License Credentials...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--ink-2)] via-[var(--ink)] to-[var(--ink)] flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-[var(--brass)]/40 bg-[var(--ink-2)] p-8 md:p-10 shadow-2xl text-center font-mono">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--ink)] border border-[var(--brass)]/40 text-3xl shadow-inner">
            🔒
          </div>

          <span className="mt-6 inline-block rounded-full bg-[var(--brass)]/10 border border-[var(--brass)]/30 px-3 py-1 text-[10px] uppercase tracking-widest text-[var(--brass)] font-bold">
            Access Restricted · Registration Required
          </span>

          <h2 className="font-display mt-3 text-2xl md:text-3xl text-[var(--paper)]">
            Create Your Account to Access EXIM Intelligence
          </h2>

          <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
            Live customs shipment records, foreign buyer profiles, and HS Code databases are reserved for registered trade businesses. Please register or sign in to continue.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/register"
              className="rounded bg-[var(--brass)] py-3.5 text-center text-xs uppercase tracking-wider text-[var(--ink)] font-bold hover:brightness-110 shadow-lg"
            >
              Register for Free 7-Day Trial →
            </Link>
            <Link
              href="/login"
              className="rounded border border-[var(--brass)]/30 py-3 text-center text-xs uppercase tracking-wider text-[var(--paper)] hover:border-[var(--brass)]"
            >
              Already Registered? Sign In
            </Link>
            <Link
              href="/"
              className="text-[11px] text-[var(--muted)] hover:text-[var(--brass)] mt-2 underline"
            >
              ← Return to Home Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
