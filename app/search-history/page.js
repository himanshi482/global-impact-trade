"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthGuard from "../../components/AuthGuard";
import FieldLabel from "../../components/FieldLabel";

export default function SearchHistoryPage() {
  const [history, setHistory] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("history"); // "history" | "saved"

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [histRes, savedRes] = await Promise.all([
          fetch("/api/search-history", { credentials: "include" }),
          fetch("/api/saved-searches", { credentials: "include" }),
        ]);

        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(histData.data || []);
        }

        if (savedRes.ok) {
          const savedData = await savedRes.json();
          setSavedSearches(savedData.data || []);
        }
      } catch (err) {
        console.error("Failed to load search history", err);
        setError("Failed to load search history records");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const deleteSavedSearch = async (id) => {
    try {
      const res = await fetch(`/api/saved-searches/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setSavedSearches((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete saved search", err);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[var(--ink)] py-12 px-6">
        <div className="mx-auto max-w-5xl">
          <FieldLabel>User Activity &amp; Saved Query Logs</FieldLabel>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--brass)]/20 pb-6 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-[var(--paper)]">
                Search History &amp; Saved Searches
              </h1>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Review your recent trade intelligence queries and quickly re-run saved filters.
              </p>
            </div>

            <div className="flex rounded-lg bg-[var(--ink-2)] p-1 border border-[var(--brass)]/30">
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-wider rounded transition ${
                  activeTab === "history"
                    ? "bg-[var(--brass)] text-[var(--ink)] font-bold shadow"
                    : "text-[var(--muted)] hover:text-[var(--paper)]"
                }`}
              >
                Recent Searches ({history.length})
              </button>
              <button
                onClick={() => setActiveTab("saved")}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-wider rounded transition ${
                  activeTab === "saved"
                    ? "bg-[var(--brass)] text-[var(--ink)] font-bold shadow"
                    : "text-[var(--muted)] hover:text-[var(--paper)]"
                }`}
              >
                Saved Queries ({savedSearches.length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20 font-mono text-xs text-[var(--brass)]">
              <span className="h-4 w-4 rounded-full border-2 border-[var(--brass)] border-t-transparent animate-spin mr-2"></span>
              Loading history logs...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-300 font-mono">
              {error}
            </div>
          ) : activeTab === "history" ? (
            history.length === 0 ? (
              <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-12 text-center font-mono">
                <p className="text-sm text-[var(--muted)]">No recent search history found.</p>
                <Link
                  href="/trade-data"
                  className="mt-4 inline-block rounded bg-[var(--brass)] px-5 py-2.5 text-xs uppercase tracking-wider text-[var(--ink)] font-bold"
                >
                  Start Exploring Trade Data →
                </Link>
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-5 transition hover:border-[var(--brass)]/40"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[var(--brass)]/10 border border-[var(--brass)]/30 px-2 py-0.5 text-[10px] text-[var(--brass)] uppercase font-bold">
                          {item.searchType}
                        </span>
                        <span className="text-[var(--paper)] font-semibold text-sm">
                          {item.query ? `"${item.query}"` : "All Records"}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--muted)]">
                        Executed at: {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <Link
                      href={`/trade-data?query=${encodeURIComponent(item.query || "")}`}
                      className="rounded border border-[var(--brass)]/40 px-4 py-2 text-center text-[11px] text-[var(--paper)] hover:bg-[var(--brass)] hover:text-[var(--ink)] font-bold transition"
                    >
                      Re-run Search →
                    </Link>
                  </div>
                ))}
              </div>
            )
          ) : savedSearches.length === 0 ? (
            <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-12 text-center font-mono">
              <p className="text-sm text-[var(--muted)]">No saved search queries available.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 font-mono text-xs">
              {savedSearches.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-[var(--brass)]/15 px-2.5 py-1 text-[10px] text-[var(--brass)] font-bold uppercase">
                        {item.searchType}
                      </span>
                      <button
                        onClick={() => deleteSavedSearch(item.id)}
                        className="text-[10px] text-red-400 hover:text-red-300"
                      >
                        ✕ Remove
                      </button>
                    </div>
                    <h3 className="font-display mt-3 text-lg text-[var(--paper)]">{item.name}</h3>
                    {item.query && (
                      <p className="mt-1 text-xs text-[var(--muted)]">Query: "{item.query}"</p>
                    )}
                  </div>

                  <div className="mt-6 border-t border-[var(--brass)]/15 pt-4">
                    <Link
                      href={`/trade-data?query=${encodeURIComponent(item.query || "")}`}
                      className="block w-full rounded bg-[var(--brass)] py-2 text-center text-xs font-bold uppercase text-[var(--ink)] hover:brightness-110"
                    >
                      Execute Saved Query →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
