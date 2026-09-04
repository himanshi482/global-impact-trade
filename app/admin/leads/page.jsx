"use client";

import { useEffect, useState, useCallback } from 'react';
import FieldLabel from '../../../components/FieldLabel';

export default function AdminLeadsPage() {
  const [filters, setFilters] = useState({ company: '', user: '', entityType: '', status: '' });
  const [status, setStatus] = useState('loading');
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [page, setPage] = useState(0);
  const limit = 25;

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
      params.set('limit', String(limit));
      params.set('offset', String(page * limit));
      const res = await fetch(`/api/admin/leads?${params.toString()}`);
      if (res.status === 403) throw new Error('forbidden');
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setLeads(data.leads || []);
      setPagination(data.pagination || { total: 0 });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, [filters, page]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  return (
    <main className="min-h-screen bg-[var(--ink)] text-[var(--paper)]">
      {/* Hero Header */}
      <section className="border-b border-[var(--brass)]/20 bg-gradient-to-b from-[var(--ink-2)] via-[var(--ink)] to-[var(--ink)] px-6 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <FieldLabel>Platform Administration</FieldLabel>
          <h1 className="font-display mt-2 text-3xl md:text-5xl text-[var(--paper)]">
            Lead Management (Admin)
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-mono text-[var(--muted)] leading-relaxed">
            Global pipeline oversight across all registered enterprise accounts, lead assignment, and conversion statuses.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 rounded-2xl border border-[var(--brass)]/25 bg-[var(--ink-2)]/90 p-5 shadow-xl">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
            <input
              className="bg-[var(--ink)] border border-[var(--brass)]/30 rounded-lg px-3.5 py-2.5 text-xs text-[var(--paper)] placeholder-[var(--muted)] focus:border-[var(--brass)] focus:outline-none transition"
              placeholder="Search company"
              value={filters.company}
              onChange={(e) => { setPage(0); setFilters((f) => ({ ...f, company: e.target.value })); }}
            />
            <input
              className="bg-[var(--ink)] border border-[var(--brass)]/30 rounded-lg px-3.5 py-2.5 text-xs text-[var(--paper)] placeholder-[var(--muted)] focus:border-[var(--brass)] focus:outline-none transition"
              placeholder="Search user (name/email)"
              value={filters.user}
              onChange={(e) => { setPage(0); setFilters((f) => ({ ...f, user: e.target.value })); }}
            />
            <select
              className="bg-[var(--ink)] border border-[var(--brass)]/30 rounded-lg px-3.5 py-2.5 text-xs text-[var(--paper)] focus:border-[var(--brass)] focus:outline-none transition cursor-pointer"
              value={filters.entityType}
              onChange={(e) => { setPage(0); setFilters((f) => ({ ...f, entityType: e.target.value })); }}
            >
              <option value="">All entity types</option>
              <option value="BUYER">Buyer</option>
              <option value="SUPPLIER">Supplier</option>
            </select>
            <select
              className="bg-[var(--ink)] border border-[var(--brass)]/30 rounded-lg px-3.5 py-2.5 text-xs text-[var(--paper)] focus:border-[var(--brass)] focus:outline-none transition cursor-pointer"
              value={filters.status}
              onChange={(e) => { setPage(0); setFilters((f) => ({ ...f, status: e.target.value })); }}
            >
              <option value="">All pipeline statuses</option>
              {['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'WON', 'LOST'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {status === 'loading' && (
          <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-8 text-center font-mono text-xs text-[var(--muted)]">
            Loading admin lead pipeline…
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-8 text-center font-mono text-xs text-rose-300">
            Could not load admin lead data — you may not have administrator access.
          </div>
        )}

        {status === 'success' && (
          <>
            {leads.length === 0 ? (
              <div className="rounded-2xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-12 text-center font-mono text-xs text-[var(--muted)]">
                No leads matched these filter criteria.
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--brass)]/20 bg-[var(--ink-2)] shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-[var(--ink)] text-[var(--brass)] uppercase tracking-wider border-b border-[var(--brass)]/20">
                      <tr>
                        <th className="py-3.5 px-4">Company</th>
                        <th className="py-3.5 px-4">Type</th>
                        <th className="py-3.5 px-4">User</th>
                        <th className="py-3.5 px-4">Score</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--brass)]/10 text-[var(--paper)]">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-[var(--brass)]/5 transition">
                          <td className="py-3.5 px-4 font-bold text-[var(--paper)]">{lead.companyName}</td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              lead.entityType === 'BUYER' 
                                ? 'bg-blue-950/80 border border-blue-500/40 text-blue-400' 
                                : 'bg-indigo-950/80 border border-indigo-500/40 text-indigo-400'
                            }`}>
                              {lead.entityType}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[var(--muted)]">{lead.user?.name || lead.user?.email || '—'}</td>
                          <td className="py-3.5 px-4 font-bold text-[var(--brass)]">{lead.leadScore}/100</td>
                          <td className="py-3.5 px-4">
                            <span className="rounded bg-[var(--ink)] border border-[var(--brass)]/30 px-2 py-0.5 text-[10px] text-[var(--paper)]">
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-[var(--muted)]">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between font-mono text-xs text-[var(--muted)] border-t border-[var(--brass)]/20 pt-6">
              <span>Total: {pagination.total} leads in database</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded border border-[var(--brass)]/30 px-3.5 py-1.5 uppercase tracking-wider text-[var(--paper)] hover:border-[var(--brass)] hover:text-[var(--brass)] disabled:opacity-40 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasMore}
                  className="rounded border border-[var(--brass)]/30 px-3.5 py-1.5 uppercase tracking-wider text-[var(--paper)] hover:border-[var(--brass)] hover:text-[var(--brass)] disabled:opacity-40 transition"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
