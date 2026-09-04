"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import FieldLabel from '../../components/FieldLabel';

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'WON', 'LOST'];

function potentialLabel(score) {
  if (score >= 80) return 'HIGH POTENTIAL';
  if (score >= 50) return 'MEDIUM POTENTIAL';
  return 'LOW POTENTIAL';
}

export default function MyLeadsPage() {
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [leads, setLeads] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [recommended, setRecommended] = useState([]);
  const [savingRecId, setSavingRecId] = useState(null);
  const [unlockingRecId, setUnlockingRecId] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/leads');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLeads(data.leads || []);
      setMetrics(data.metrics || null);
      setStatus('success');

      // Fetch recommended buyers based on active leads or default HS code
      const targetHs = data.leads?.[0]?.hsCode || '010121';
      const targetCountry = data.leads?.[0]?.country || 'Germany';
      fetch(`/api/export-planner/recommended-buyers?hsCode=${encodeURIComponent(targetHs)}&targetCountry=${encodeURIComponent(targetCountry)}&limit=3`)
        .then((r) => (r.ok ? r.json() : { buyers: [] }))
        .then((recData) => setRecommended(recData.buyers || []))
        .catch(() => {});
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  const updateStatus = async (leadId, newStatus) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  };

  const saveNotes = async (leadId) => {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notesDraft }),
    });
    setEditingNotesId(null);
    load();
  };

  const deleteLead = async (leadId) => {
    if (!confirm('Remove this lead from your pipeline?')) return;
    await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
    load();
  };

  const saveRecommendedLead = async (buyer) => {
    setSavingRecId(buyer.id);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'BUYER',
          entityId: buyer.id,
          leadScore: buyer.leadScore,
          notes: 'Saved from Recommended Leads',
        }),
      });
      if (res.status === 409) {
        alert('Lead is already in your pipeline.');
      } else if (!res.ok) {
        alert('Could not save lead. Please try again.');
      } else {
        alert(`${buyer.companyName} added to pipeline.`);
        load();
      }
    } finally {
      setSavingRecId(null);
    }
  };

  const unlockRecommendedLead = async (buyer) => {
    setUnlockingRecId(buyer.id);
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'BUYER', entityId: buyer.id }),
      });
      if (res.status === 403) {
        alert('Your contact unlock limit has been reached.');
      } else if (!res.ok) {
        alert('Could not unlock contact. Please try again.');
      } else {
        alert('Contact unlocked! Reloading lead details…');
        load();
      }
    } finally {
      setUnlockingRecId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--ink)] text-[var(--paper)]">
      {/* Hero Header */}
      <section className="border-b border-[var(--brass)]/20 bg-gradient-to-b from-[var(--ink-2)] via-[var(--ink)] to-[var(--ink)] px-6 py-12 md:py-16">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <FieldLabel>Enterprise Pipeline & CRM</FieldLabel>
            <h1 className="font-display mt-2 text-3xl md:text-5xl text-[var(--paper)]">
              My Trade Leads
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-mono text-[var(--muted)] leading-relaxed">
              Manage your saved buyer and supplier relationships, track engagement statuses, and log internal procurement notes.
            </p>
          </div>
          <div className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/leads/export"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--brass)] px-5 py-3 font-mono text-xs uppercase tracking-widest text-[var(--ink)] font-bold hover:brightness-110 shadow-lg transition"
            >
              <span>📥</span> Export CSV Pipeline
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        {status === 'loading' && (
          <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-8 text-center font-mono text-xs text-[var(--muted)]">
            Loading your trade pipeline…
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-8 text-center font-mono text-xs text-rose-300">
            Could not load your leads. Please verify your authentication and try again.
          </div>
        )}

        {status === 'success' && metrics && (
          <>
            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-10">
              <Metric label="Total Leads" value={metrics.total} />
              <Metric label="New" value={metrics.new} />
              <Metric label="Contacted" value={metrics.contacted} />
              <Metric label="Qualified" value={metrics.qualified} />
              <Metric label="Negotiating" value={metrics.negotiating} />
              <Metric label="Won" value={metrics.won} />
              <Metric label="Lost" value={metrics.lost} />
              <Metric label="High Potential" value={metrics.highPotential} highlight />
            </div>

            {/* Recommended Leads Section (Stage 3 Phase 3) */}
            {recommended.length > 0 && (
              <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 shadow-xl mb-10 font-mono text-xs">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4 border-b border-[var(--brass)]/20 pb-3">
                  <div>
                    <span className="text-[10px] text-[var(--brass)] uppercase font-bold tracking-wider">
                      Export Decision Engine Intelligence
                    </span>
                    <h3 className="font-display text-xl text-[var(--paper)] mt-0.5">
                      Recommended Leads for Your Pipeline
                    </h3>
                  </div>
                  <Link
                    href="/export-planner"
                    className="text-[11px] text-[var(--brass)] hover:underline uppercase font-bold"
                  >
                    Open Export Planner →
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {recommended.map((recBuyer) => (
                    <div
                      key={recBuyer.id}
                      className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink)] p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/buyers/${recBuyer.id}`}
                            className="font-display text-base text-[var(--paper)] font-bold hover:text-[var(--brass)] transition truncate"
                          >
                            {recBuyer.companyName}
                          </Link>
                          {recBuyer.verified && (
                            <span className="rounded bg-emerald-950 border border-emerald-500/40 px-1.5 py-0.2 text-[9px] text-emerald-400 shrink-0">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--brass)] mt-0.5">📍 {recBuyer.country}</p>
                        <p className="text-[10px] text-[var(--muted)] mt-2 truncate">
                          Commodity: {recBuyer.product || 'General'}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className="rounded bg-[var(--brass)]/15 px-1.5 py-0.5 text-[var(--brass)] font-bold">
                            Match: {recBuyer.matchScore || 85}/100
                          </span>
                          <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-emerald-400 font-bold">
                            Lead: {recBuyer.leadScore || 75}/100
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[var(--brass)]/15 flex items-center justify-between gap-2">
                        <Link
                          href={`/buyers/${recBuyer.id}`}
                          className="text-[10px] text-[var(--muted)] hover:text-[var(--paper)] uppercase"
                        >
                          View Profile
                        </Link>
                        <button
                          type="button"
                          onClick={() => saveRecommendedLead(recBuyer)}
                          disabled={savingRecId === recBuyer.id}
                          className="rounded bg-[var(--brass)] px-3 py-1 font-bold text-[10px] uppercase text-[var(--ink)] hover:brightness-110 disabled:opacity-50"
                        >
                          {savingRecId === recBuyer.id ? 'Saving…' : '+ Add Lead'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {leads.length === 0 ? (
              <div className="rounded-2xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-12 text-center shadow-xl">
                <span className="text-4xl">📋</span>
                <h3 className="font-display text-xl text-[var(--paper)] mt-4">No leads saved in your pipeline yet</h3>
                <p className="mt-2 text-xs font-mono text-[var(--muted)] max-w-md mx-auto">
                  Discover verified buyers and manufacturers from our global EXIM database to start building your deals pipeline.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3 font-mono text-xs">
                  <Link
                    href="/buyer-discovery"
                    className="rounded bg-[var(--brass)] px-4 py-2 font-bold uppercase tracking-wider text-[var(--ink)] hover:brightness-110 shadow"
                  >
                    Discover Buyers →
                  </Link>
                  <Link
                    href="/supplier-discovery"
                    className="rounded border border-[var(--brass)]/40 px-4 py-2 uppercase tracking-wider text-[var(--paper)] hover:border-[var(--brass)] hover:text-[var(--brass)]"
                  >
                    Discover Suppliers →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--brass)]/20 bg-[var(--ink-2)] shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-[var(--ink)] text-[var(--brass)] uppercase tracking-wider border-b border-[var(--brass)]/20">
                      <tr>
                        <th className="py-3.5 px-4">Company</th>
                        <th className="py-3.5 px-4">Country</th>
                        <th className="py-3.5 px-4">Type</th>
                        <th className="py-3.5 px-4">Score</th>
                        <th className="py-3.5 px-4">Potential</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Added</th>
                        <th className="py-3.5 px-4">Notes</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--brass)]/10 text-[var(--paper)]">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-[var(--brass)]/5 transition">
                          <td className="py-3.5 px-4">
                            <Link
                              href={`/${lead.entityType === 'BUYER' ? 'buyers' : 'suppliers'}/${lead.entityId}`}
                              className="font-bold text-[var(--paper)] hover:text-[var(--brass)] transition"
                            >
                              {lead.companyName}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4 text-[var(--muted)]">{lead.country}</td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              lead.entityType === 'BUYER' 
                                ? 'bg-blue-950/80 border border-blue-500/40 text-blue-400' 
                                : 'bg-indigo-950/80 border border-indigo-500/40 text-indigo-400'
                            }`}>
                              {lead.entityType}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[var(--brass)]">{lead.leadScore}/100</td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              lead.leadScore >= 80 
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40' 
                                : lead.leadScore >= 50 
                                ? 'bg-[var(--brass)]/15 text-[var(--brass)] border border-[var(--brass)]/40' 
                                : 'bg-[var(--ink)] text-[var(--muted)] border border-[var(--muted)]/40'
                            }`}>
                              {potentialLabel(lead.leadScore)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={lead.status}
                              onChange={(e) => updateStatus(lead.id, e.target.value)}
                              className="bg-[var(--ink)] border border-[var(--brass)]/30 rounded px-2.5 py-1 text-xs text-[var(--paper)] focus:border-[var(--brass)] focus:outline-none cursor-pointer"
                            >
                              {STATUSES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-[var(--muted)] whitespace-nowrap">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            {editingNotesId === lead.id ? (
                              <div className="flex gap-2">
                                <textarea
                                  className="bg-[var(--ink)] border border-[var(--brass)]/40 rounded px-2 py-1 text-xs text-[var(--paper)] w-full focus:outline-none"
                                  value={notesDraft}
                                  onChange={(e) => setNotesDraft(e.target.value)}
                                  rows={2}
                                />
                                <button
                                  onClick={() => saveNotes(lead.id)}
                                  className="rounded bg-[var(--brass)] text-[var(--ink)] font-bold px-2 py-1 text-[10px] uppercase tracking-wider hover:brightness-110 self-start"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingNotesId(lead.id);
                                  setNotesDraft(lead.notes || '');
                                }}
                                className="text-left text-[var(--muted)] hover:text-[var(--brass)] text-xs underline underline-offset-2"
                              >
                                {lead.notes ? lead.notes : '+ Add note…'}
                              </button>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => deleteLead(lead.id)}
                              className="rounded border border-rose-500/40 bg-rose-950/20 px-2.5 py-1 text-[10px] uppercase tracking-wider text-rose-300 hover:bg-rose-900/40 transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, highlight }) {
  return (
    <div className={`rounded-xl border p-3.5 text-center font-mono shadow transition ${
      highlight 
        ? 'border-emerald-500/50 bg-emerald-950/30' 
        : 'border-[var(--brass)]/20 bg-[var(--ink-2)]'
    }`}>
      <div className={`text-2xl font-bold font-display ${highlight ? 'text-emerald-400' : 'text-[var(--brass)]'}`}>
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">{label}</div>
    </div>
  );
}
