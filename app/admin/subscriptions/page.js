"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthGuard from "../../../components/AuthGuard";
import FieldLabel from "../../../components/FieldLabel";

const PLAN_LABELS = {
  FREE: "Free Explorer Trial",
  GROWTH: "Growth (Exim Cloud)",
  CONNECT: "Connect Pro",
  CONQUER: "Conquer Global Suite",
};

export default function AdminSubscriptionsPage() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading"); // "loading" | "done"
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/subscriptions", { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) setRows(data.data || []);
        else setError(data.error || "Failed to load subscriptions");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Failed to fetch subscription records");
      })
      .finally(() => {
        if (!cancelled) setStatus("done");
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const loading = status === "loading";

  const updatePlan = async (userId, plan) => {
    setSavingId(userId);
    try {
      const res = await fetch(`/api/admin/subscriptions/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan, status: "ACTIVE" }),
      });
      if (res.ok) {
        setReloadKey((k) => k + 1); // refresh so plan + quota numbers reflect the change
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to update plan");
      }
    } catch (err) {
      console.error("Update plan error", err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[var(--ink)] py-12 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <Link href="/admin" className="font-mono text-xs text-[var(--brass)] hover:underline">
              ← Back to Admin Console
            </Link>
          </div>

          <FieldLabel>Subscription Management</FieldLabel>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--brass)]/20 pb-6 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-[var(--paper)]">
                User Plans &amp; Unlock Quotas
              </h1>
              <p className="mt-1 text-xs text-[var(--muted)] font-mono">
                No payment gateway is wired up yet — assign or change a user&apos;s plan here manually.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20 font-mono text-xs text-[var(--brass)]">
              <span className="h-4 w-4 rounded-full border-2 border-[var(--brass)] border-t-transparent animate-spin mr-2"></span>
              Loading subscriptions...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-300 font-mono">
              {error}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] overflow-hidden shadow-2xl font-mono text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--brass)]/20 bg-[var(--ink)] text-[var(--brass)] uppercase text-[10px] tracking-wider">
                      <th className="p-4">User</th>
                      <th className="p-4">Current Plan</th>
                      <th className="p-4">Unlock Quota Used</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Change Plan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--brass)]/10 text-[var(--paper)]">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-[var(--muted)]">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      rows.map((r) => (
                        <tr key={r.id} className="hover:bg-[var(--brass)]/5 transition">
                          <td className="p-4">
                            <p className="font-bold">{r.name}</p>
                            <p className="text-[var(--muted)]">{r.email}</p>
                          </td>
                          <td className="p-4">
                            <span className="rounded bg-[var(--brass)]/20 px-2 py-0.5 text-[var(--brass)] font-bold uppercase">
                              {PLAN_LABELS[r.plan] || r.plan}
                            </span>
                          </td>
                          <td className="p-4">
                            {r.quota?.isUnlimited ? (
                              <span className="text-emerald-400 font-bold">Unlimited</span>
                            ) : (
                              <span>
                                {r.quota?.used ?? 0} / {r.quota?.maxAllowed ?? "-"}
                                {r.quota?.remaining === 0 && (
                                  <span className="ml-2 text-red-400 font-bold">FULL</span>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-[var(--muted)]">{r.status || "-"}</td>
                          <td className="p-4 text-right">
                            <select
                              value={r.plan}
                              disabled={savingId === r.id}
                              onChange={(e) => updatePlan(r.id, e.target.value)}
                              className="rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-2 py-1.5 text-[var(--paper)] disabled:opacity-50"
                            >
                              {Object.keys(PLAN_LABELS).map((p) => (
                                <option key={p} value={p}>
                                  {PLAN_LABELS[p]}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
