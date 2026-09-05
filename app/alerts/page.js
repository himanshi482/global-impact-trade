"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AuthGuard from "../../components/AuthGuard";
import FieldLabel from "../../components/FieldLabel";

const ALERT_TYPES = [
  {
    type: "OPPORTUNITY_SCORE",
    label: "Opportunity Score",
    icon: "📈",
    desc: "Notify when trade opportunity index reaches or exceeds threshold.",
    badge: "border-emerald-500/40 bg-emerald-950/50 text-emerald-300",
  },
  {
    type: "RISK_LEVEL",
    label: "Risk Level",
    icon: "⚠️",
    desc: "Alert when market risk reaches High, Medium, or Low level.",
    badge: "border-amber-500/40 bg-amber-950/50 text-amber-300",
  },
  {
    type: "HS_CODE",
    label: "HS Code Activity",
    icon: "📦",
    desc: "Monitor trade intelligence shifts for a specific product HS code.",
    badge: "border-blue-500/40 bg-blue-950/50 text-blue-300",
  },
  {
    type: "COUNTRY",
    label: "Country Destination",
    icon: "🌍",
    desc: "Track regulatory changes and demand in a target destination.",
    badge: "border-purple-500/40 bg-purple-950/50 text-purple-300",
  },
  {
    type: "BUYER_ACTIVITY",
    label: "Buyer Activity",
    icon: "👥",
    desc: "Trigger when active verified buyer count crosses minimum threshold.",
    badge: "border-[var(--brass)]/50 bg-[var(--brass)]/15 text-[var(--brass)]",
  },
  {
    type: "SHIPMENT_ACTIVITY",
    label: "Shipment Volume",
    icon: "🚢",
    desc: "Notify when bill of lading volume reaches minimum shipment threshold.",
    badge: "border-cyan-500/40 bg-cyan-950/50 text-cyan-300",
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [filter, setFilter] = useState("ALL"); // ALL | ACTIVE | INACTIVE
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("OPPORTUNITY_SCORE");
  const [formScoreThreshold, setFormScoreThreshold] = useState(70);
  const [formBuyerThreshold, setFormBuyerThreshold] = useState(5);
  const [formShipmentThreshold, setFormShipmentThreshold] = useState(10);
  const [formRiskLevel, setFormRiskLevel] = useState("HIGH");
  const [formHsCode, setFormHsCode] = useState("");
  const [formCountry, setFormCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/alerts");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load alerts");
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err.message || "Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional data fetch on mount
    loadAlerts();
  }, [loadAlerts]);

  // Construct Criteria based on type
  const buildCriteria = () => {
    switch (formType) {
      case "OPPORTUNITY_SCORE":
        return { threshold: Number(formScoreThreshold) || 70 };
      case "BUYER_ACTIVITY":
        return { threshold: Number(formBuyerThreshold) || 5 };
      case "SHIPMENT_ACTIVITY":
        return { threshold: Number(formShipmentThreshold) || 10 };
      case "RISK_LEVEL":
        return { level: formRiskLevel };
      case "HS_CODE":
        return { hsCode: formHsCode.trim() };
      case "COUNTRY":
        return { country: formCountry.trim() };
      default:
        return { threshold: 70 };
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setSubmitting(true);

    const criteria = buildCriteria();

    // Basic validation
    if (formType === "HS_CODE" && !formHsCode.trim()) {
      setError("Please enter a valid HS Code.");
      setSubmitting(false);
      return;
    }
    if (formType === "COUNTRY" && !formCountry.trim()) {
      setError("Please enter a target Country.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          alertType: formType,
          criteria,
          isActive: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to create alert");
      }

      setSuccessMsg(`Alert "${formName}" created successfully!`);
      setFormName("");
      setFormHsCode("");
      setFormCountry("");
      setShowCreateModal(false);
      await loadAlerts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active/Inactive
  const toggleAlertStatus = async (alert) => {
    setActionInProgressId(alert.id);
    setError("");
    try {
      const nextStatus = !alert.isActive;
      const response = await fetch(`/api/alerts/${alert.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update alert");

      setAlerts((prev) =>
        prev.map((item) =>
          item.id === alert.id ? { ...item, isActive: nextStatus } : item
        )
      );
      setSuccessMsg(`Alert "${alert.name}" is now ${nextStatus ? "Active" : "Paused"}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Delete Alert
  const deleteAlert = async (alertId, alertName) => {
    if (!window.confirm(`Are you sure you want to delete "${alertName}"?`)) return;

    setActionInProgressId(alertId);
    setError("");
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete alert");

      setAlerts((prev) => prev.filter((item) => item.id !== alertId));
      setSuccessMsg(`Alert "${alertName}" deleted.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Run Check/Evaluate Now
  const evaluateNow = async () => {
    setEvaluating(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/alerts/evaluate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to evaluate alerts");

      setSuccessMsg(data.message || "Alert check completed!");
      await loadAlerts();
    } catch (err) {
      setError(err.message);
    } finally {
      setEvaluating(false);
    }
  };

  const activeCount = alerts.filter((a) => a.isActive).length;
  const triggeredCount = alerts.filter((a) => a.lastTriggeredAt).length;

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "ACTIVE") return alert.isActive;
    if (filter === "INACTIVE") return !alert.isActive;
    return true;
  });

  const formatCriteriaText = (alert) => {
    const c = typeof alert.criteria === "string" ? JSON.parse(alert.criteria) : alert.criteria || {};
    switch (alert.alertType) {
      case "OPPORTUNITY_SCORE":
        return `Trigger when Opportunity Score ≥ ${c.threshold ?? 70}/100`;
      case "RISK_LEVEL":
        return `Trigger when Risk Level is ${c.level || "HIGH"}`;
      case "HS_CODE":
        return `Monitor HS Code: ${c.hsCode || "N/A"}`;
      case "COUNTRY":
        return `Monitor Country: ${c.country || "N/A"}`;
      case "BUYER_ACTIVITY":
        return `Trigger when Verified Buyers ≥ ${c.threshold ?? 5}`;
      case "SHIPMENT_ACTIVITY":
        return `Trigger when Shipment Volume ≥ ${c.threshold ?? 10}`;
      default:
        return JSON.stringify(c);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[var(--ink)] py-12 px-4 sm:px-6 lg:px-8 text-[var(--paper)]">
        <div className="mx-auto max-w-6xl font-mono">
          <FieldLabel>Automated Surveillance &amp; Trade Triggers</FieldLabel>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--brass)]/20 pb-6 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-3xl sm:text-4xl text-[var(--paper)]">
                  Market Alerts
                </h1>
                <span className="rounded bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                  Autonomous Engine
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)] font-mono">
                Set real-time alerts for opportunity scores, tariff risks, buyer demand, and shipment spikes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={evaluateNow}
                disabled={evaluating || activeCount === 0}
                className="flex items-center gap-2 rounded-lg border border-[var(--brass)]/50 bg-[var(--ink-2)] px-4 py-2.5 text-xs text-[var(--brass)] hover:border-[var(--brass)] hover:bg-[var(--brass)]/10 transition disabled:opacity-50 cursor-pointer shadow-md"
              >
                <span className={evaluating ? "animate-spin" : ""}>⚡</span>
                <span>{evaluating ? "Evaluating Live..." : "Check & Trigger Now"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 rounded-lg bg-[var(--brass)] px-4 py-2.5 text-xs font-bold uppercase text-[var(--ink)] hover:opacity-90 transition cursor-pointer shadow-md"
              >
                <span>＋</span>
                <span>New Alert</span>
              </button>
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

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-4 shadow">
              <span className="text-[10px] text-[var(--muted)] uppercase block">Total Configured</span>
              <span className="font-display text-2xl text-[var(--paper)] mt-1 block">
                {alerts.length}
              </span>
            </div>

            <div className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-4 shadow">
              <span className="text-[10px] text-[var(--muted)] uppercase block">Active Monitors</span>
              <span className="font-display text-2xl text-emerald-400 mt-1 block">
                {activeCount}
              </span>
            </div>

            <div className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-4 shadow">
              <span className="text-[10px] text-[var(--muted)] uppercase block">Trigger Events</span>
              <span className="font-display text-2xl text-[var(--brass)] mt-1 block">
                {triggeredCount}
              </span>
            </div>

            <div className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-4 shadow flex flex-col justify-between">
              <span className="text-[10px] text-[var(--muted)] uppercase block">Trigger Inbox</span>
              <Link
                href="/notifications"
                className="text-xs text-[var(--brass)] hover:underline flex items-center gap-1.5 mt-1"
              >
                <span>View Notifications</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between border-b border-[var(--brass)]/15 pb-4 mb-6">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--muted)] mr-2">Filter:</span>
              {[
                { key: "ALL", label: `All (${alerts.length})` },
                { key: "ACTIVE", label: `Active (${activeCount})` },
                { key: "INACTIVE", label: `Paused (${alerts.length - activeCount})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`rounded px-3 py-1 transition cursor-pointer ${
                    filter === tab.key
                      ? "bg-[var(--brass)] text-[var(--ink)] font-bold"
                      : "bg-[var(--ink-2)] text-[var(--muted)] border border-[var(--brass)]/20 hover:text-[var(--paper)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-[var(--muted)] hidden sm:inline">
              Engine updates automatically or on demand
            </span>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-xs text-[var(--brass)]">
              <span className="h-7 w-7 rounded-full border-2 border-[var(--brass)] border-t-transparent animate-spin mb-3"></span>
              Synchronizing market monitors...
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="rounded-2xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-12 text-center">
              <span className="text-4xl">🔔</span>
              <h2 className="font-display text-2xl text-[var(--paper)] mt-4">
                {filter === "ALL"
                  ? "No Market Alerts Created Yet"
                  : `No ${filter.toLowerCase()} alerts found`}
              </h2>
              <p className="mt-2 text-xs text-[var(--muted)] max-w-md mx-auto leading-relaxed">
                Configure automated surveillance triggers to get immediate notifications when trade opportunity
                indexes rise, buyers post requests, or risk profiles shift.
              </p>
              {filter === "ALL" && (
                <button
                  type="button"
                  onClick={() => {
                    setFormName("High Opportunity Coffee Alert");
                    setFormType("OPPORTUNITY_SCORE");
                    setFormScoreThreshold(75);
                    setShowCreateModal(true);
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--brass)] px-5 py-2.5 text-xs font-bold uppercase text-[var(--ink)] hover:opacity-90 transition cursor-pointer"
                >
                  <span>＋ Create First Alert</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredAlerts.map((alert) => {
                const meta = ALERT_TYPES.find((t) => t.type === alert.alertType) || ALERT_TYPES[0];
                const isWorking = actionInProgressId === alert.id;

                return (
                  <div
                    key={alert.id}
                    className={`rounded-xl border bg-[var(--ink-2)] p-5 shadow-lg transition flex flex-col justify-between ${
                      alert.isActive
                        ? "border-[var(--brass)]/30 hover:border-[var(--brass)]/60"
                        : "border-slate-800 opacity-75"
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{meta.icon}</span>
                          <div>
                            <h3 className="font-display text-lg text-[var(--paper)] leading-tight">
                              {alert.name}
                            </h3>
                            <span
                              className={`mt-1 inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${meta.badge}`}
                            >
                              {meta.label}
                            </span>
                          </div>
                        </div>

                        {/* Status Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => toggleAlertStatus(alert)}
                          disabled={isWorking}
                          className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase border transition cursor-pointer ${
                            alert.isActive
                              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900"
                              : "bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800"
                          }`}
                          title="Click to toggle active/pause"
                        >
                          {alert.isActive ? "● Active" : "○ Paused"}
                        </button>
                      </div>

                      {/* Criteria Description */}
                      <div className="mt-4 rounded-lg bg-[var(--ink)] p-3 border border-[var(--brass)]/10 text-xs">
                        <span className="text-[10px] text-[var(--muted)] uppercase block mb-1">
                          Condition Trigger
                        </span>
                        <p className="text-[var(--paper)] font-medium">
                          {formatCriteriaText(alert)}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-4 pt-3 border-t border-[var(--brass)]/15 flex items-center justify-between text-xs text-[var(--muted)]">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span>🕒</span>
                        <span>
                          {alert.lastTriggeredAt
                            ? `Last triggered: ${new Date(alert.lastTriggeredAt).toLocaleDateString()}`
                            : "Waiting for trigger criteria"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => deleteAlert(alert.id, alert.name)}
                          disabled={isWorking}
                          className="text-rose-400 hover:text-rose-300 text-[11px] hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Creation Modal / Drawer */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--ink)]/80 backdrop-blur-sm">
              <div className="relative w-full max-w-xl rounded-2xl border border-[var(--brass)]/40 bg-[var(--ink-2)] p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[var(--brass)]/20 pb-4 mb-6">
                  <div>
                    <h2 className="font-display text-2xl text-[var(--paper)]">
                      Create Market Alert
                    </h2>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Configure automated trade surveillance triggers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-lg p-2 text-sm text-[var(--muted)] hover:text-[var(--paper)] hover:bg-[var(--ink)] cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateAlert} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] text-[var(--muted)] uppercase tracking-wider mb-1.5">
                      Alert Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. EU Coffee Opportunity > 75"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full rounded-lg border border-[var(--brass)]/30 bg-[var(--ink)] p-2.5 text-xs text-[var(--paper)] focus:border-[var(--brass)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[var(--muted)] uppercase tracking-wider mb-1.5">
                      Surveillance Type
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full rounded-lg border border-[var(--brass)]/30 bg-[var(--ink)] p-2.5 text-xs text-[var(--paper)] focus:border-[var(--brass)] focus:outline-none cursor-pointer"
                    >
                      {ALERT_TYPES.map((t) => (
                        <option key={t.type} value={t.type}>
                          {t.icon} {t.label} — {t.desc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Contextual Criteria Input based on Alert Type */}
                  <div className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink)] p-4 space-y-3">
                    <span className="text-[10px] text-[var(--brass)] uppercase tracking-wider block font-bold">
                      Trigger Configuration
                    </span>

                    {formType === "OPPORTUNITY_SCORE" && (
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <label className="text-[var(--muted)]">Minimum Opportunity Score (0 - 100):</label>
                          <strong className="text-[var(--brass)] font-bold">{formScoreThreshold}/100</strong>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="95"
                          step="5"
                          value={formScoreThreshold}
                          onChange={(e) => setFormScoreThreshold(Number(e.target.value))}
                          className="w-full accent-[var(--brass)] cursor-pointer"
                        />
                        <p className="mt-1 text-[10px] text-[var(--muted)]">
                          Dispatches an alert as soon as our scoring algorithm calculates an overall opportunity score at or above {formScoreThreshold}.
                        </p>
                      </div>
                    )}

                    {formType === "RISK_LEVEL" && (
                      <div>
                        <label className="block text-[var(--muted)] mb-1.5">
                          Target Risk Severity Level:
                        </label>
                        <select
                          value={formRiskLevel}
                          onChange={(e) => setFormRiskLevel(e.target.value)}
                          className="w-full rounded-lg border border-[var(--brass)]/25 bg-[var(--ink-2)] p-2 text-xs text-[var(--paper)]"
                        >
                          <option value="HIGH">HIGH RISK — Regulatory or commercial exposure</option>
                          <option value="MEDIUM">MEDIUM RISK — Moderate tariff or market instability</option>
                          <option value="LOW">LOW RISK — Favorable and secure trade channels</option>
                        </select>
                      </div>
                    )}

                    {formType === "HS_CODE" && (
                      <div>
                        <label className="block text-[var(--muted)] mb-1.5">
                          Product HS Code (e.g. 010121, 090111):
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 090111"
                          value={formHsCode}
                          onChange={(e) => setFormHsCode(e.target.value)}
                          className="w-full rounded-lg border border-[var(--brass)]/25 bg-[var(--ink-2)] p-2 text-xs text-[var(--paper)] focus:border-[var(--brass)] focus:outline-none"
                        />
                        <p className="mt-1 text-[10px] text-[var(--muted)]">
                          Triggers updates when new market intelligence or shipments occur for this 6-digit HS code.
                        </p>
                      </div>
                    )}

                    {formType === "COUNTRY" && (
                      <div>
                        <label className="block text-[var(--muted)] mb-1.5">
                          Destination Country:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Germany, United States, Japan"
                          value={formCountry}
                          onChange={(e) => setFormCountry(e.target.value)}
                          className="w-full rounded-lg border border-[var(--brass)]/25 bg-[var(--ink-2)] p-2 text-xs text-[var(--paper)] focus:border-[var(--brass)] focus:outline-none"
                        />
                      </div>
                    )}

                    {formType === "BUYER_ACTIVITY" && (
                      <div>
                        <label className="block text-[var(--muted)] mb-1.5">
                          Minimum Verified Buyers Threshold:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={formBuyerThreshold}
                          onChange={(e) => setFormBuyerThreshold(Number(e.target.value))}
                          className="w-full rounded-lg border border-[var(--brass)]/25 bg-[var(--ink-2)] p-2 text-xs text-[var(--paper)] focus:border-[var(--brass)] focus:outline-none"
                        />
                      </div>
                    )}

                    {formType === "SHIPMENT_ACTIVITY" && (
                      <div>
                        <label className="block text-[var(--muted)] mb-1.5">
                          Minimum Bill of Lading Shipments:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={formShipmentThreshold}
                          onChange={(e) => setFormShipmentThreshold(Number(e.target.value))}
                          className="w-full rounded-lg border border-[var(--brass)]/25 bg-[var(--ink-2)] p-2 text-xs text-[var(--paper)] focus:border-[var(--brass)] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--brass)]/20">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="rounded-lg border border-[var(--brass)]/20 px-4 py-2 text-xs text-[var(--muted)] hover:text-[var(--paper)] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-lg bg-[var(--brass)] px-5 py-2 text-xs font-bold uppercase text-[var(--ink)] hover:opacity-90 disabled:opacity-50 transition cursor-pointer"
                    >
                      {submitting ? "Deploying Alert..." : "Deploy Alert"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
