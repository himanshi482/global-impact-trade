"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthGuard from "../../../components/AuthGuard";
import FieldLabel from "../../../components/FieldLabel";

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    country: "India",
    city: "Mumbai",
    product: "",
    hs_code: "",
    export_volume: "",
    verified: true,
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    try {
      const res = await fetch("/api/admin/suppliers", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setSuppliers(data.data || []);
      else setError(data.error || "Failed to load suppliers");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch supplier records");
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ company_name: "", country: "India", city: "", product: "", hs_code: "", export_volume: "", verified: true });
        loadSuppliers();
      }
    } catch (err) {
      console.error("Create supplier error", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this supplier record?")) return;
    try {
      const res = await fetch(`/api/admin/suppliers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setSuppliers((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("Delete supplier error", err);
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

          <FieldLabel>Directory Management</FieldLabel>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--brass)]/20 pb-6 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-[var(--paper)]">
                Verified Suppliers Directory CRUD
              </h1>
              <p className="mt-1 text-xs text-[var(--muted)] font-mono">
                Manage manufacturer and exporter profiles in the live database.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="rounded bg-[var(--brass)] px-5 py-2.5 font-mono text-xs font-bold uppercase text-[var(--ink)] hover:brightness-110"
            >
              + Add New Supplier Entity
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20 font-mono text-xs text-[var(--brass)]">
              <span className="h-4 w-4 rounded-full border-2 border-[var(--brass)] border-t-transparent animate-spin mr-2"></span>
              Loading suppliers...
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
                      <th className="p-4">ID</th>
                      <th className="p-4">Company Name</th>
                      <th className="p-4">Country / City</th>
                      <th className="p-4">Product Line</th>
                      <th className="p-4">HS Code</th>
                      <th className="p-4">Export Capacity</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--brass)]/10 text-[var(--paper)]">
                    {suppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-[var(--brass)]/5 transition">
                        <td className="p-4 font-bold text-[var(--brass)]">#{s.id}</td>
                        <td className="p-4 font-bold">{s.company_name}</td>
                        <td className="p-4 text-[var(--muted)]">
                          {s.country} {s.city ? `(${s.city})` : ""}
                        </td>
                        <td className="p-4 max-w-xs truncate">{s.product}</td>
                        <td className="p-4">{s.hs_code || "-"}</td>
                        <td className="p-4">{s.export_volume || "-"}</td>
                        <td className="p-4 text-right">
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
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono text-xs">
            <div className="w-full max-w-md rounded-xl border border-[var(--brass)]/40 bg-[var(--ink-2)] p-6 shadow-2xl space-y-4">
              <h3 className="font-display text-xl text-[var(--paper)]">Add Supplier Entity</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-[var(--muted)] uppercase mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] uppercase mb-1">Country</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] uppercase mb-1">Product Description *</label>
                  <input
                    type="text"
                    required
                    value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] uppercase mb-1">HS Code</label>
                  <input
                    type="text"
                    value={form.hs_code}
                    onChange={(e) => setForm({ ...form, hs_code: e.target.value })}
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] uppercase mb-1">Export Capacity</label>
                  <input
                    type="text"
                    value={form.export_volume}
                    onChange={(e) => setForm({ ...form, export_volume: e.target.value })}
                    placeholder="e.g. 10,000 MT/Yr"
                    className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-2 text-[var(--paper)]"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-[var(--brass)]/20 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded border border-[var(--brass)]/30 px-4 py-2 text-[var(--muted)] hover:text-[var(--paper)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-[var(--brass)] px-5 py-2 font-bold text-[var(--ink)]"
                  >
                    Save Supplier
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
