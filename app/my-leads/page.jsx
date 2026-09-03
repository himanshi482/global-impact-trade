'use client';

// app/my-leads/page.jsx
// Stage 3 Phase 2 — /my-leads

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

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

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/leads');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLeads(data.leads);
      setMetrics(data.metrics);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional data fetch on mount
    load();
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

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-yellow-400">My Leads</h1>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not page navigation */}
          <a
            href="/api/leads/export"
            className="border border-neutral-700 rounded px-3 py-2 text-sm hover:border-yellow-500"
          >
            Export CSV
          </a>
        </div>

        {status === 'loading' && <p className="text-neutral-400">Loading your pipeline…</p>}
        {status === 'error' && (
          <p className="text-red-400">Could not load your leads. Please try again.</p>
        )}

        {status === 'success' && metrics && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
              <Metric label="Total" value={metrics.total} />
              <Metric label="New" value={metrics.new} />
              <Metric label="Contacted" value={metrics.contacted} />
              <Metric label="Qualified" value={metrics.qualified} />
              <Metric label="Negotiating" value={metrics.negotiating} />
              <Metric label="Won" value={metrics.won} />
              <Metric label="Lost" value={metrics.lost} />
              <Metric label="High Potential" value={metrics.highPotential} highlight />
            </div>

            {leads.length === 0 ? (
              <p className="text-neutral-500 border border-neutral-800 rounded-lg p-6 text-center">
                No leads saved yet. Discover buyers or suppliers to start building your pipeline.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-neutral-300">
                  <thead className="text-neutral-500 text-left border-b border-neutral-800">
                    <tr>
                      <th className="py-2 pr-4">Company</th>
                      <th className="py-2 pr-4">Country</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Score</th>
                      <th className="py-2 pr-4">Potential</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Added</th>
                      <th className="py-2 pr-4">Notes</th>
                      <th className="py-2 pr-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-neutral-900">
                        <td className="py-2 pr-4">
                          <Link
                            href={`/${lead.entityType === 'BUYER' ? 'buyers' : 'suppliers'}/${lead.entityId}`}
                            className="hover:text-yellow-400"
                          >
                            {lead.companyName}
                          </Link>
                        </td>
                        <td className="py-2 pr-4">{lead.country}</td>
                        <td className="py-2 pr-4">{lead.entityType}</td>
                        <td className="py-2 pr-4">{lead.leadScore}/100</td>
                        <td className="py-2 pr-4">{potentialLabel(lead.leadScore)}</td>
                        <td className="py-2 pr-4">
                          <select
                            value={lead.status}
                            onChange={(e) => updateStatus(lead.id, e.target.value)}
                            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-4">{new Date(lead.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 pr-4 max-w-xs">
                          {editingNotesId === lead.id ? (
                            <div className="flex gap-2">
                              <textarea
                                className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs w-full"
                                value={notesDraft}
                                onChange={(e) => setNotesDraft(e.target.value)}
                              />
                              <button
                                onClick={() => saveNotes(lead.id)}
                                className="text-xs text-yellow-400"
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
                              className="text-left text-neutral-400 hover:text-white text-xs"
                            >
                              {lead.notes ? lead.notes : 'Add note…'}
                            </button>
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value, highlight }) {
  return (
    <div className={`border rounded-lg p-3 text-center ${highlight ? 'border-yellow-500' : 'border-neutral-800'}`}>
      <div className={`text-xl font-semibold ${highlight ? 'text-yellow-400' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-xs text-neutral-500">{label}</div>
    </div>
  );
}
