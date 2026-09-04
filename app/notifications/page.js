"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AuthGuard from "../../components/AuthGuard";
import FieldLabel from "../../components/FieldLabel";

const TYPE_CONFIG = {
  ALERT: {
    label: "Market Alert",
    icon: "🔔",
    badge: "border-[var(--brass)]/50 bg-[var(--brass)]/15 text-[var(--brass)]",
    linkText: "View Alerts",
    linkHref: "/alerts",
  },
  LEAD: {
    label: "Lead Pipeline",
    icon: "🎯",
    badge: "border-emerald-500/40 bg-emerald-950/60 text-emerald-300",
    linkText: "Open Pipeline",
    linkHref: "/my-leads",
  },
  SAVED_ANALYSIS: {
    label: "Market Trend",
    icon: "📊",
    badge: "border-blue-500/40 bg-blue-950/60 text-blue-300",
    linkText: "View Analysis",
    linkHref: "/market-analysis",
  },
  SYSTEM: {
    label: "System Notice",
    icon: "⚙️",
    badge: "border-purple-500/40 bg-purple-950/60 text-purple-300",
    linkText: "Dashboard",
    linkHref: "/dashboard",
  },
};

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 3) return date.toLocaleDateString();
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffMin > 0) return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
  return "Just now";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | UNREAD
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | ALERT | LEAD | SAVED_ANALYSIS | SYSTEM
  const [operatingId, setOperatingId] = useState(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load notifications");
      }
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Mark all read
  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "PUT" });
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
      setSuccessMsg("All notifications marked as read.");
    } catch (err) {
      setError("Failed to mark all as read: " + err.message);
    }
  };

  // Mark single item read
  const markItemRead = async (id) => {
    setOperatingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      if (res.ok) {
        setNotifications((items) =>
          items.map((item) => (item.id === id ? { ...item, isRead: true } : item))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOperatingId(null);
    }
  };

  // Delete single item
  const deleteItem = async (id) => {
    setOperatingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotifications((items) => items.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOperatingId(null);
    }
  };

  // Clear all read items
  const clearReadItems = async () => {
    try {
      const res = await fetch("/api/notifications?scope=read", { method: "DELETE" });
      if (res.ok) {
        setNotifications((items) => items.filter((item) => !item.isRead));
        setSuccessMsg("Cleared all read notifications.");
      }
    } catch (err) {
      setError("Failed to clear read notifications");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((item) => {
    if (statusFilter === "UNREAD" && item.isRead) return false;
    if (typeFilter !== "ALL" && item.type !== typeFilter) return false;
    return true;
  });

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[var(--ink)] py-12 px-4 sm:px-6 lg:px-8 text-[var(--paper)]">
        <div className="mx-auto max-w-5xl font-mono">
          <FieldLabel>Workspace Communications &amp; Dispatch</FieldLabel>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--brass)]/20 pb-6 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-3xl sm:text-4xl text-[var(--paper)]">
                  Notifications
                </h1>
                {unreadCount > 0 ? (
                  <span className="rounded bg-amber-500/20 border border-amber-500/50 px-2.5 py-1 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                    {unreadCount} Unread
                  </span>
                ) : (
                  <span className="rounded bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                    All Caught Up
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[var(--muted)] font-mono">
                Real-time trigger dispatches, lead follow-ups, and platform activity logs.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={loadNotifications}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--brass)]/30 bg-[var(--ink-2)] px-3 py-2 text-xs text-[var(--brass)] hover:border-[var(--brass)] transition disabled:opacity-50 cursor-pointer"
                title="Refresh feed"
              >
                <span className={loading ? "animate-spin" : ""}>🔄</span>
                <span>Refresh</span>
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="rounded-lg bg-[var(--brass)] px-4 py-2 text-xs font-bold uppercase text-[var(--ink)] hover:opacity-90 transition cursor-pointer shadow-md"
                >
                  Mark All Read
                </button>
              )}

              {notifications.some((n) => n.isRead) && (
                <button
                  type="button"
                  onClick={clearReadItems}
                  className="rounded-lg border border-[var(--brass)]/25 bg-[var(--ink-2)] px-3 py-2 text-xs text-[var(--muted)] hover:text-rose-300 hover:border-rose-500/40 transition cursor-pointer"
                >
                  Clear Read
                </button>
              )}
            </div>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-4 mb-6 text-xs text-red-300 flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 mb-6 text-xs text-emerald-300 flex items-center justify-between">
              <span>{successMsg}</span>
              <button
                type="button"
                onClick={() => setSuccessMsg("")}
                className="text-emerald-400 hover:text-emerald-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--brass)]/15 pb-4 mb-6 text-xs">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--muted)] mr-1">Status:</span>
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`rounded px-3 py-1 transition cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-[var(--brass)] text-[var(--ink)] font-bold"
                    : "bg-[var(--ink-2)] text-[var(--muted)] border border-[var(--brass)]/20 hover:text-[var(--paper)]"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("UNREAD")}
                className={`rounded px-3 py-1 transition cursor-pointer ${
                  statusFilter === "UNREAD"
                    ? "bg-[var(--brass)] text-[var(--ink)] font-bold"
                    : "bg-[var(--ink-2)] text-[var(--muted)] border border-[var(--brass)]/20 hover:text-[var(--paper)]"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Type Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[var(--muted)] mr-1">Type:</span>
              {[
                { key: "ALL", label: "All Types" },
                { key: "ALERT", label: "Alerts" },
                { key: "LEAD", label: "Leads" },
                { key: "SAVED_ANALYSIS", label: "Analyses" },
                { key: "SYSTEM", label: "System" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTypeFilter(t.key)}
                  className={`rounded px-2.5 py-1 text-[11px] transition cursor-pointer ${
                    typeFilter === t.key
                      ? "bg-[var(--paper)] text-[var(--ink)] font-bold"
                      : "bg-[var(--ink-2)] text-[var(--muted)] border border-[var(--brass)]/20 hover:text-[var(--paper)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notification List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-xs text-[var(--brass)]">
              <span className="h-7 w-7 rounded-full border-2 border-[var(--brass)] border-t-transparent animate-spin mb-3"></span>
              Checking notification inbox...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-2xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-12 text-center">
              <span className="text-4xl">📬</span>
              <h2 className="font-display text-2xl text-[var(--paper)] mt-4">
                {statusFilter === "UNREAD"
                  ? "No Unread Notifications"
                  : "No Notifications Found"}
              </h2>
              <p className="mt-2 text-xs text-[var(--muted)] max-w-md mx-auto leading-relaxed">
                When your automated market alerts trigger, lead follow-ups arrive, or system
                updates occur, they will be archived here in real time.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/alerts"
                  className="rounded-lg bg-[var(--brass)] px-5 py-2.5 text-xs font-bold uppercase text-[var(--ink)] hover:opacity-90 transition inline-block"
                >
                  Configure Market Alerts →
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((item) => {
                const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.SYSTEM;
                const isOperating = operatingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-5 shadow transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      item.isRead
                        ? "border-[var(--brass)]/15 bg-[var(--ink-2)]/70 opacity-80"
                        : "border-[var(--brass)]/40 bg-[var(--ink-2)] shadow-md relative overflow-hidden"
                    }`}
                  >
                    {!item.isRead && (
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-[var(--brass)]" />
                    )}

                    {/* Left: Icon & Content */}
                    <div className="flex items-start gap-3.5 max-w-2xl">
                      <div className="text-2xl pt-0.5 shrink-0">{config.icon}</div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${config.badge}`}
                          >
                            {config.label}
                          </span>
                          {!item.isRead && (
                            <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                          )}
                          <span className="text-[10px] text-[var(--muted)]">
                            {formatTimeAgo(item.createdAt)} · {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h3 className="font-display text-base text-[var(--paper)] font-semibold">
                          {item.title}
                        </h3>

                        <p className="text-xs text-[var(--paper-dim)] leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--brass)]/10">
                      {/* Deep Link to associated page */}
                      {config.linkHref && (
                        <Link
                          href={config.linkHref}
                          className="rounded-lg border border-[var(--brass)]/30 bg-[var(--ink)] px-3 py-1.5 text-xs text-[var(--brass)] hover:border-[var(--brass)] transition flex items-center gap-1"
                        >
                          <span>{config.linkText}</span>
                          <span>→</span>
                        </Link>
                      )}

                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={() => markItemRead(item.id)}
                          disabled={isOperating}
                          className="rounded-lg bg-[var(--brass)]/20 border border-[var(--brass)]/40 px-2.5 py-1.5 text-xs text-[var(--brass)] hover:bg-[var(--brass)]/30 transition cursor-pointer"
                          title="Mark as read"
                        >
                          ✓ Read
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        disabled={isOperating}
                        className="rounded-lg p-1.5 text-xs text-[var(--muted)] hover:text-rose-300 hover:bg-rose-950/30 transition cursor-pointer"
                        title="Delete notification"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
