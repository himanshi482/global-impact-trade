"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthGuard from "../../../components/AuthGuard";
import FieldLabel from "../../../components/FieldLabel";

const EMPTY_FORM = {
  code: "",
  description: "",
  chapter: "",
  bcd: "",
  sws: "",
  igst: "",
  country: "India",
};

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return null;
  return <span className="ml-1">{sortDir === "asc" ? "▲" : "▼"}</span>;
}

export default function AdminHsCodesPage() {
  const [hsCodes, setHsCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterChapter, setFilterChapter] = useState("");

  // Pagination & sort
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState("code");
  const [sortDir, setSortDir] = useState("asc");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // trigger counter
  const [fetchTick, setFetchTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    params.set("sort", `${sortField}:${sortDir}`);
    if (search) params.set("q", search);
    if (filterChapter) params.set("chapter", filterChapter);

    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    fetch(`/api/admin/hs-codes?${params}`, { credentials: "include" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (ok) {
          setHsCodes(data.data || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotal(data.pagination?.total || 0);
          setError("");
        } else {
          setError(data.error || "Failed to load HS codes");
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Network error loading HS codes");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [page, sortField, sortDir, search, filterChapter, fetchTick]);

  function reload() {
    setFetchTick((t) => t + 1);
  }

  function showSuccessMsg(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(h) {
    setForm({
      code: h.code || "",
      description: h.description || "",
      chapter: h.chapter || "",
      bcd: h.bcd || "",
      sws: h.sws || "",
      igst: h.igst || "",
      country: h.country || "India",
    });
    setEditingId(h.id);
    setFormError("");
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.code.trim() || !form.description.trim()) {
      setFormError("Code and description are required");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const url = editingId ? `/api/admin/hs-codes/${editingId}` : "/api/admin/hs-codes";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        showSuccessMsg(editingId ? "HS code updated successfully" : "HS code created successfully");
        reload();
      } else {
        setFormError(data.error || "Operation failed");
      }
    } catch {
      setFormError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this HS code?")) return;
    try {
      const res = await fetch(`/api/admin/hs-codes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        showSuccessMsg("HS code deleted");
        reload();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete HS code");
      }
    } catch {
      setError("Network error deleting HS code");
    }
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    reload();
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[var(--ink)] py-12 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <Link href="/admin" className="font-mono text-xs text-[var(--brass)] hover:underline">
              ← Back to Admin Console
            </Link>
          </div>

          <FieldLabel>HS Code Database Management</FieldLabel>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--brass)]/20 pb-6 mb-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-[var(--paper)]">
                HS Codes CRUD
              </h1>
              <p className="mt-1 text-xs text-[var(--muted)] font-mono">
                {total} HS code records in database
              </p>
            </div>
            <button
              onClick={openCreate}
              className="rounded bg-[var(--brass)] px-5 py-2.5 font-mono text-xs font-bold uppercase text-[var(--ink)] hover:brightness-110"
            >
              + Add New HS Code
            </button>
          </div>

          {/* Success Toast */}
          {success && (
            <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-950/60 px-4 py-3 text-xs text-emerald-300 font-mono">
              ✓ {success}
            </div>
          )}

          {/* Search & Filters */}
          <form onSubmit={handleSearch} className="mb-6 grid gap-3 sm:grid-cols-3 font-mono text-xs">
            <input
              type="text"
              placeholder="Search code or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3 py-2 text-[var(--paper)] placeholder:text-[var(--muted)]"
            />
            <input
              type="text"
              placeholder="Filter by chapter (e.g. 09)…"
              value={filterChapter}
              onChange={(e) => setFilterChapter(e.target.value)}
              className="rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3 py-2 text-[var(--paper)] placeholder:text-[var(--muted)]"
            />
            <button type="submit" className="rounded bg-[var(--brass)] px-4 py-2 font-bold text-[var(--ink)] hover:brightness-110">
              Search
            </button>
          </form>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-20 font-mono text-xs text-[var(--brass)]">
              <span className="h-4 w-4 rounded-full border-2 border-[var(--brass)] border-t-transparent animate-spin mr-2" />
              Loading HS codes…
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-300 font-mono">
              {error}
            </div>
          ) : hsCodes.length === 0 ? (
            <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-12 text-center font-mono">
              <span className="text-3xl block mb-3">📋</span>
              <p className="text-sm text-[var(--muted)]">No HS code records found</p>
              <p className="text-xs text-[var(--muted)] mt-1">Try adjusting your filters, or add a new HS code.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] overflow-hidden shadow-2xl font-mono text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--brass)]/20 bg-[var(--ink)] text-[var(--brass)] uppercase text-[10px] tracking-wider">
                      <th className="p-4 cursor-pointer select-none" onClick={() => handleSort("id")}>
                        ID <SortIcon field="id" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th className="p-4 cursor-pointer select-none" onClick={() => handleSort("code")}>
                        Code <SortIcon field="code" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th className="p-4 cursor-pointer select-none" onClick={() => handleSort("description")}>
                        Description <SortIcon field="description" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th className="p-4 cursor-pointer select-none" onClick={() => handleSort("chapter")}>
                        Chapter <SortIcon field="chapter" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th className="p-4">BCD</th>
                      <th className="p-4">SWS</th>
                      <th className="p-4">IGST</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--brass)]/10 text-[var(--paper)]">
                    {hsCodes.map((h) => (
                      <tr key={h.id} className="hover:bg-[var(--brass)]/5 transition">
                        <td className="p-4 font-bold text-[var(--brass)]">#{h.id}</td>
                        <td className="p-4 font-bold">{h.code}</td>
                        <td className="p-4 max-w-xs truncate">{h.description}</td>
                        <td className="p-4">{h.chapter}</td>
                        <td className="p-4">{h.bcd || "-"}</td>
                        <td className="p-4">{h.sws || "-"}</td>
                        <td className="p-4">{h.igst || "-"}</td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEdit(h)}
                            className="rounded border border-[var(--brass)]/40 px-3 py-1 text-[10px] text-[var(--brass)] hover:bg-[var(--brass)]/10 font-bold mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(h.id)}
                            className="rounded border border-red-500/40 px-3 py-1 text-[10px] text-red-400 hover:bg-red-950 font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-[var(--brass)]/20 px-4 py-3 text-[10px] text-[var(--muted)]">
                <span>Page {page} of {totalPages} · {total} records</span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded border border-[var(--brass)]/30 px-3 py-1 text-[var(--paper)] disabled:opacity-30 hover:bg-[var(--brass)]/10"
                  >
                    ← Prev
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded border border-[var(--brass)]/30 px-3 py-1 text-[var(--paper)] disabled:opacity-30 hover:bg-[var(--brass)]/10"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono text-xs">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-[var(--brass)]/40 bg-[var(--ink-2)] p-6 shadow-2xl space-y-4">
              <h3 className="font-display text-xl text-[var(--paper)]">
                {editingId ? "Edit HS Code" : "Add HS Code"}
              </h3>
              {formError && (
                <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-300">
                  {formError}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">HS Code *</label>
                    <input type="text" required value={form.code} placeholder="e.g. 09011100"
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                  </div>
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Chapter</label>
                    <input type="text" value={form.chapter} placeholder="Auto from code"
                      onChange={(e) => setForm({ ...form, chapter: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--muted)] uppercase mb-1">Description *</label>
                  <input type="text" required value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">BCD %</label>
                    <input type="text" value={form.bcd} placeholder="e.g. 10%"
                      onChange={(e) => setForm({ ...form, bcd: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                  </div>
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">SWS %</label>
                    <input type="text" value={form.sws} placeholder="e.g. 10%"
                      onChange={(e) => setForm({ ...form, sws: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                  </div>
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">IGST %</label>
                    <input type="text" value={form.igst} placeholder="e.g. 5%"
                      onChange={(e) => setForm({ ...form, igst: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--muted)] uppercase mb-1">Country</label>
                  <input type="text" value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                </div>
                <div className="flex justify-end gap-2 border-t border-[var(--brass)]/20 pt-4">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="rounded border border-[var(--brass)]/30 px-4 py-2 text-[var(--muted)] hover:text-[var(--paper)]">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="rounded bg-[var(--brass)] px-5 py-2 font-bold text-[var(--ink)] disabled:opacity-50">
                    {submitting ? "Saving…" : editingId ? "Update HS Code" : "Save HS Code"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
