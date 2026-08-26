"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthGuard from "../../../components/AuthGuard";
import FieldLabel from "../../../components/FieldLabel";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("/api/admin/users", { credentials: "include" });
        const data = await res.json();
        if (res.ok) {
          setUsers(data.data || []);
        } else {
          setError(data.error || "Failed to load user list");
        }
      } catch (err) {
        console.error("Admin users error", err);
        setError("Network error loading users");
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      console.error("Failed to toggle role", err);
    }
  };

  const toggleActive = async (userId, currentActive) => {
    const newActive = !currentActive;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: newActive }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: newActive } : u))
        );
      }
    } catch (err) {
      console.error("Failed to toggle active state", err);
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

          <FieldLabel>Platform User Control</FieldLabel>
          <h1 className="font-display text-3xl md:text-4xl text-[var(--paper)] mb-2">
            User Accounts &amp; Permissions
          </h1>
          <p className="text-xs text-[var(--muted)] font-mono mb-8">
            Toggle administrative privileges or change account activation status.
          </p>

          {loading ? (
            <div className="flex justify-center py-20 font-mono text-xs text-[var(--brass)]">
              <span className="h-4 w-4 rounded-full border-2 border-[var(--brass)] border-t-transparent animate-spin mr-2"></span>
              Loading accounts...
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
                      <th className="p-4">Email</th>
                      <th className="p-4">Company</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--brass)]/10 text-[var(--paper)]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[var(--brass)]/5 transition">
                        <td className="p-4 font-bold">{u.name}</td>
                        <td className="p-4 text-[var(--muted)]">{u.email}</td>
                        <td className="p-4">{u.companyName || "-"}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === "ADMIN"
                                ? "bg-[var(--brass)] text-[var(--ink)]"
                                : "bg-[var(--ink)] border border-[var(--brass)]/30 text-[var(--muted)]"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-[10px] font-bold ${
                              u.isActive ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {u.isActive ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => toggleRole(u.id, u.role)}
                            className="rounded border border-[var(--brass)]/30 px-3 py-1 text-[10px] hover:border-[var(--brass)]"
                          >
                            Set {u.role === "ADMIN" ? "USER" : "ADMIN"}
                          </button>
                          <button
                            onClick={() => toggleActive(u.id, u.isActive)}
                            className={`rounded px-3 py-1 text-[10px] font-bold ${
                              u.isActive
                                ? "bg-red-950 text-red-300 border border-red-500/30"
                                : "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
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
      </main>
    </AuthGuard>
  );
}
