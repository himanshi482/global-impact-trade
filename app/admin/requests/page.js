"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthGuard from "../../../components/AuthGuard";
import FieldLabel from "../../../components/FieldLabel";

export default function AdminRequestsPage() {
  const [contacts, setContacts] = useState([]);
  const [demos, setDemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("contacts"); // "contacts" | "demos"

  useEffect(() => {
    async function loadRequests() {
      try {
        const res = await fetch("/api/admin/requests", { credentials: "include" });
        const data = await res.json();
        if (res.ok) {
          setContacts(data.contacts || []);
          setDemos(data.demos || []);
        } else {
          setError(data.error || "Failed to load requests");
        }
      } catch (err) {
        console.error("Requests error", err);
        setError("Network error fetching requests");
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, []);

  const updateStatus = async (id, type, newStatus) => {
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type, status: newStatus }),
      });
      if (res.ok) {
        if (type === "contact") {
          setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
        } else {
          setDemos((prev) => prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d)));
        }
      }
    } catch (err) {
      console.error("Update status error", err);
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

          <FieldLabel>Inbound Business Leads</FieldLabel>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--brass)]/20 pb-6 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-[var(--paper)]">
                Contact &amp; Demo Requests
              </h1>
              <p className="mt-1 text-xs text-[var(--muted)] font-mono">
                Track submitted inquiry forms and scheduled 1-on-1 EXIM demo sessions.
              </p>
            </div>

            <div className="flex rounded-lg bg-[var(--ink-2)] p-1 border border-[var(--brass)]/30 font-mono text-xs">
              <button
                onClick={() => setActiveTab("contacts")}
                className={`px-4 py-2 uppercase tracking-wider rounded transition ${
                  activeTab === "contacts"
                    ? "bg-[var(--brass)] text-[var(--ink)] font-bold shadow"
                    : "text-[var(--muted)] hover:text-[var(--paper)]"
                }`}
              >
                Contact Inquiries ({contacts.length})
              </button>
              <button
                onClick={() => setActiveTab("demos")}
                className={`px-4 py-2 uppercase tracking-wider rounded transition ${
                  activeTab === "demos"
                    ? "bg-[var(--brass)] text-[var(--ink)] font-bold shadow"
                    : "text-[var(--muted)] hover:text-[var(--paper)]"
                }`}
              >
                Demo Bookings ({demos.length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20 font-mono text-xs text-[var(--brass)]">
              <span className="h-4 w-4 rounded-full border-2 border-[var(--brass)] border-t-transparent animate-spin mr-2"></span>
              Loading requests...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-300 font-mono">
              {error}
            </div>
          ) : activeTab === "contacts" ? (
            <div className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] overflow-hidden shadow-2xl font-mono text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--brass)]/20 bg-[var(--ink)] text-[var(--brass)] uppercase text-[10px] tracking-wider">
                      <th className="p-4">Submitted At</th>
                      <th className="p-4">Name &amp; Email</th>
                      <th className="p-4">Company / Phone</th>
                      <th className="p-4">Message</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--brass)]/10 text-[var(--paper)]">
                    {contacts.map((c) => (
                      <tr key={c.id} className="hover:bg-[var(--brass)]/5 transition">
                        <td className="p-4 text-[var(--muted)] text-[10px]">
                          {new Date(c.created_at).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <strong className="block">{c.name}</strong>
                          <span className="text-[var(--muted)] text-[11px]">{c.email}</span>
                        </td>
                        <td className="p-4">
                          <div>{c.company || "-"}</div>
                          <div className="text-[var(--muted)] text-[11px]">{c.phone || "-"}</div>
                        </td>
                        <td className="p-4 max-w-xs truncate">{c.message || "-"}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              c.status === "NEW"
                                ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                                : c.status === "CONTACTED"
                                ? "bg-blue-950 text-blue-300 border border-blue-500/40"
                                : "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1">
                          {c.status === "NEW" && (
                            <button
                              onClick={() => updateStatus(c.id, "contact", "CONTACTED")}
                              className="rounded border border-blue-500/40 px-2.5 py-1 text-[10px] text-blue-300 hover:bg-blue-950 font-bold"
                            >
                              Mark Contacted
                            </button>
                          )}
                          {c.status !== "CLOSED" && (
                            <button
                              onClick={() => updateStatus(c.id, "contact", "CLOSED")}
                              className="rounded border border-emerald-500/40 px-2.5 py-1 text-[10px] text-emerald-300 hover:bg-emerald-950 font-bold"
                            >
                              Close Lead
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] overflow-hidden shadow-2xl font-mono text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--brass)]/20 bg-[var(--ink)] text-[var(--brass)] uppercase text-[10px] tracking-wider">
                      <th className="p-4">Submitted At</th>
                      <th className="p-4">Name &amp; Email</th>
                      <th className="p-4">Company &amp; Phone</th>
                      <th className="p-4">Details / Slot</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--brass)]/10 text-[var(--paper)]">
                    {demos.map((d) => (
                      <tr key={d.id} className="hover:bg-[var(--brass)]/5 transition">
                        <td className="p-4 text-[var(--muted)] text-[10px]">
                          {new Date(d.created_at).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <strong className="block">{d.name}</strong>
                          <span className="text-[var(--muted)] text-[11px]">{d.email}</span>
                        </td>
                        <td className="p-4">
                          <div>{d.company || "-"}</div>
                          <div className="text-[var(--muted)] text-[11px]">{d.phone || "-"}</div>
                        </td>
                        <td className="p-4 max-w-xs truncate">{d.message || "-"}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              d.status === "NEW"
                                ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                                : d.status === "CONTACTED"
                                ? "bg-blue-950 text-blue-300 border border-blue-500/40"
                                : "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1">
                          {d.status === "NEW" && (
                            <button
                              onClick={() => updateStatus(d.id, "demo", "CONTACTED")}
                              className="rounded border border-blue-500/40 px-2.5 py-1 text-[10px] text-blue-300 hover:bg-blue-950 font-bold"
                            >
                              Mark Contacted
                            </button>
                          )}
                          {d.status !== "CLOSED" && (
                            <button
                              onClick={() => updateStatus(d.id, "demo", "CLOSED")}
                              className="rounded border border-emerald-500/40 px-2.5 py-1 text-[10px] text-emerald-300 hover:bg-emerald-950 font-bold"
                            >
                              Close Demo
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
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
