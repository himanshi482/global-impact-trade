"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthGuard from "../../../components/AuthGuard";
import FieldLabel from "../../../components/FieldLabel";

const EMPTY_FORM = {
  exporter: "",
  importer: "",
  product: "",
  hs_code: "",
  quantity: "",
  unit: "",
  shipment_value: "",
  origin_country: "",
  destination_country: "",
  origin_port: "",
  destination_port: "",
  shipment_date: "",
};

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return null;
  return <span className="ml-1">{sortDir === "asc" ? "▲" : "▼"}</span>;
}

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterHsCode, setFilterHsCode] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterDest, setFilterDest] = useState("");

  // Pagination & sort
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState("id");
  const [sortDir, setSortDir] = useState("desc");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // trigger counter — incrementing causes useEffect to re-fetch
  const [fetchTick, setFetchTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    params.set("sort", `${sortField}:${sortDir}`);
    if (search) params.set("q", search);
    if (filterProduct) params.set("product", filterProduct);
    if (filterHsCode) params.set("hsCode", filterHsCode);
    if (filterOrigin) params.set("originCountry", filterOrigin);
    if (filterDest) params.set("destinationCountry", filterDest);

    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    fetch(`/api/admin/shipments?${params}`, { credentials: "include" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (ok) {
          setShipments(data.data || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotal(data.pagination?.total || 0);
          setError("");
        } else {
          setError(data.error || "Failed to load shipments");
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Network error loading shipments");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [page, sortField, sortDir, search, filterProduct, filterHsCode, filterOrigin, filterDest, fetchTick]);

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

  function openEdit(s) {
    setForm({
      exporter: s.exporter || "",
      importer: s.importer || "",
      product: s.product || "",
      hs_code: s.hs_code || "",
      quantity: s.quantity != null ? String(s.quantity) : "",
      unit: s.unit || "",
      shipment_value: s.shipment_value != null ? String(s.shipment_value) : "",
      origin_country: s.origin_country || "",
      destination_country: s.destination_country || "",
      origin_port: s.origin_port || "",
      destination_port: s.destination_port || "",
      shipment_date: s.shipment_date
        ? new Date(s.shipment_date).toISOString().slice(0, 10)
        : "",
    });
    setEditingId(s.id);
    setFormError("");
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.product.trim()) {
      setFormError("Product is required");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const url = editingId
        ? `/api/admin/shipments/${editingId}`
        : "/api/admin/shipments";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          quantity: form.quantity ? Number(form.quantity) : null,
          shipment_value: form.shipment_value ? Number(form.shipment_value) : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        showSuccessMsg(editingId ? "Shipment updated successfully" : "Shipment created successfully");
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
    if (!confirm("Are you sure you want to delete this shipment record?")) return;
    try {
      const res = await fetch(`/api/admin/shipments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        showSuccessMsg("Shipment deleted");
        reload();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete shipment");
      }
    } catch {
      setError("Network error deleting shipment");
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

          <FieldLabel>Shipment Records Management</FieldLabel>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--brass)]/20 pb-6 mb-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-[var(--paper)]">
                Shipments CRUD
              </h1>
              <p className="mt-1 text-xs text-[var(--muted)] font-mono">
                {total} shipment records in database
              </p>
            </div>
            <button
              onClick={openCreate}
              className="rounded bg-[var(--brass)] px-5 py-2.5 font-mono text-xs font-bold uppercase text-[var(--ink)] hover:brightness-110"
            >
              + Add New Shipment
            </button>
          </div>

          {/* Success Toast */}
          {success && (
            <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-950/60 px-4 py-3 text-xs text-emerald-300 font-mono">
              ✓ {success}
            </div>
          )}

          {/* Search & Filters */}
          <form onSubmit={handleSearch} className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 font-mono text-xs">
            <input
              type="text"
              placeholder="Search all fields…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3 py-2 text-[var(--paper)] placeholder:text-[var(--muted)] sm:col-span-2"
            />
            <input
              type="text"
              placeholder="Filter product…"
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3 py-2 text-[var(--paper)] placeholder:text-[var(--muted)]"
            />
            <input
              type="text"
              placeholder="Filter HS code…"
              value={filterHsCode}
              onChange={(e) => setFilterHsCode(e.target.value)}
              className="rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3 py-2 text-[var(--paper)] placeholder:text-[var(--muted)]"
            />
            <input
              type="text"
              placeholder="Origin country…"
              value={filterOrigin}
              onChange={(e) => setFilterOrigin(e.target.value)}
              className="rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3 py-2 text-[var(--paper)] placeholder:text-[var(--muted)]"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Destination…"
                value={filterDest}
                onChange={(e) => setFilterDest(e.target.value)}
                className="flex-1 rounded border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3 py-2 text-[var(--paper)] placeholder:text-[var(--muted)]"
              />
              <button type="submit" className="rounded bg-[var(--brass)] px-4 py-2 font-bold text-[var(--ink)] hover:brightness-110">
                Go
              </button>
            </div>
          </form>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-20 font-mono text-xs text-[var(--brass)]">
              <span className="h-4 w-4 rounded-full border-2 border-[var(--brass)] border-t-transparent animate-spin mr-2" />
              Loading shipments…
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-300 font-mono">
              {error}
            </div>
          ) : shipments.length === 0 ? (
            <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-12 text-center font-mono">
              <span className="text-3xl block mb-3">📦</span>
              <p className="text-sm text-[var(--muted)]">No shipment records found</p>
              <p className="text-xs text-[var(--muted)] mt-1">Try adjusting your filters, or add a new shipment.</p>
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
                      <th className="p-4">Exporter</th>
                      <th className="p-4">Importer</th>
                      <th className="p-4 cursor-pointer select-none" onClick={() => handleSort("product")}>
                        Product <SortIcon field="product" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th className="p-4 cursor-pointer select-none" onClick={() => handleSort("hsCode")}>
                        HS Code <SortIcon field="hsCode" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th className="p-4 cursor-pointer select-none" onClick={() => handleSort("originCountry")}>
                        Origin <SortIcon field="originCountry" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th className="p-4 cursor-pointer select-none" onClick={() => handleSort("destinationCountry")}>
                        Dest. <SortIcon field="destinationCountry" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th className="p-4 cursor-pointer select-none" onClick={() => handleSort("shipmentDate")}>
                        Date <SortIcon field="shipmentDate" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--brass)]/10 text-[var(--paper)]">
                    {shipments.map((s) => (
                      <tr key={s.id} className="hover:bg-[var(--brass)]/5 transition">
                        <td className="p-4 font-bold text-[var(--brass)]">#{s.id}</td>
                        <td className="p-4 max-w-[140px] truncate">{s.exporter || "-"}</td>
                        <td className="p-4 max-w-[140px] truncate">{s.importer || "-"}</td>
                        <td className="p-4 max-w-[160px] truncate">{s.product || "-"}</td>
                        <td className="p-4">{s.hs_code || "-"}</td>
                        <td className="p-4">{s.origin_country || "-"}</td>
                        <td className="p-4">{s.destination_country || "-"}</td>
                        <td className="p-4 whitespace-nowrap">
                          {s.shipment_date ? new Date(s.shipment_date).toLocaleDateString() : "-"}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEdit(s)}
                            className="rounded border border-[var(--brass)]/40 px-3 py-1 text-[10px] text-[var(--brass)] hover:bg-[var(--brass)]/10 font-bold mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
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
                {editingId ? "Edit Shipment" : "Add Shipment"}
              </h3>
              {formError && (
                <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-300">
                  {formError}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Exporter</label>
                    <input type="text" value={form.exporter} onChange={(e) => setForm({ ...form, exporter: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                  </div>
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Importer</label>
                    <input type="text" value={form.importer} onChange={(e) => setForm({ ...form, importer: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--muted)] uppercase mb-1">Product *</label>
                  <input type="text" required value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">HS Code</label>
                    <input type="text" value={form.hs_code} onChange={(e) => setForm({ ...form, hs_code: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                  </div>
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Quantity</label>
                    <input type="number" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                  </div>
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Unit</label>
                    <input type="text" value={form.unit} placeholder="e.g. KGS" onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Value (USD)</label>
                    <input type="number" step="any" value={form.shipment_value} onChange={(e) => setForm({ ...form, shipment_value: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                  </div>
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Shipment Date</label>
                    <input type="date" value={form.shipment_date} onChange={(e) => setForm({ ...form, shipment_date: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Origin Country</label>
                    <input type="text" value={form.origin_country} onChange={(e) => setForm({ ...form, origin_country: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                  </div>
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Dest. Country</label>
                    <input type="text" value={form.destination_country} onChange={(e) => setForm({ ...form, destination_country: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Origin Port</label>
                    <input type="text" value={form.origin_port} onChange={(e) => setForm({ ...form, origin_port: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                  </div>
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Dest. Port</label>
                    <input type="text" value={form.destination_port} onChange={(e) => setForm({ ...form, destination_port: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-[var(--brass)]/20 pt-4">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="rounded border border-[var(--brass)]/30 px-4 py-2 text-[var(--muted)] hover:text-[var(--paper)]">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="rounded bg-[var(--brass)] px-5 py-2 font-bold text-[var(--ink)] disabled:opacity-50">
                    {submitting ? "Saving…" : editingId ? "Update Shipment" : "Save Shipment"}
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
