"use client";

import { useState } from "react";
import FieldLabel from "../../components/FieldLabel";
import Link from "next/link";

export default function BookDemoPage() {
  const [booked, setBooked] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("Tomorrow at 11:30 AM IST");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    productLine: "Agricultural / Spices",
    selectedFeatures: ["Foreign Buyers Search", "Nexus 2.0 Map"]
  });

  const slots = [
    "Today at 4:00 PM IST",
    "Tomorrow at 11:30 AM IST",
    "Tomorrow at 3:00 PM IST",
    "Wednesday at 10:00 AM IST",
    "Wednesday at 2:30 PM IST"
  ];

  const handleFeatureToggle = (feat) => {
    setFormData((prev) => {
      const exists = prev.selectedFeatures.includes(feat);
      return {
        ...prev,
        selectedFeatures: exists
          ? prev.selectedFeatures.filter((f) => f !== feat)
          : [...prev.selectedFeatures, feat]
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setBooked(true);
  };

  return (
    <main className="min-h-screen">
      {/* Hero Header */}
      <section className="border-b border-[var(--brass)]/20 bg-gradient-to-b from-[var(--ink-2)] to-[var(--ink)] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brass)]/40 bg-[var(--brass)]/10 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-[var(--brass)]">
            Live 1-on-1 Walkthrough
          </span>
          <h1 className="font-display mt-4 text-4xl text-[var(--paper)] md:text-5xl">
            Book a Live EXIM Intelligence Demo
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-[var(--muted)] leading-relaxed md:text-base">
            See how GlobeBridge uncovers hidden buyers, tracks competitor shipments, and streamlines export documentation for your specific products in real time.
          </p>
        </div>
      </section>

      {/* Demo Booking Container */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 md:p-10 shadow-2xl">
            {booked ? (
              <div className="rounded-xl bg-emerald-950/70 border border-emerald-500/40 p-8 text-center font-mono">
                <span className="text-5xl">📅</span>
                <h2 className="font-display mt-4 text-3xl text-emerald-300">
                  Demo Session Confirmed!
                </h2>
                <p className="mt-3 text-sm text-[var(--paper)]">
                  Hi <strong>{formData.name}</strong>, your live trade intelligence demo is scheduled for:
                </p>
                <div className="mt-4 inline-block rounded-lg bg-[var(--ink)] px-6 py-3 border border-[var(--brass)]/40 text-[var(--brass)] font-bold text-base">
                  ⏰ {selectedSlot}
                </div>
                <p className="mt-4 text-xs text-[var(--muted)] max-w-md mx-auto">
                  A Google Meet invitation and custom product dossier have been sent to <strong>{formData.email}</strong>. Our senior trade analyst will prepare live buyer records for <strong>{formData.productLine}</strong>.
                </p>
                <div className="mt-6 flex justify-center gap-4">
                  <Link
                    href="/trade-data"
                    className="rounded bg-[var(--brass)] px-6 py-2.5 text-xs uppercase tracking-wider text-[var(--ink)] font-bold"
                  >
                    Browse Live Data While You Wait →
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 font-mono text-xs">
                {/* Personal & Company details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jordan Rao"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Work Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="jordan@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Mobile / WhatsApp Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Primary Product Line / HS Code</label>
                    <select
                      value={formData.productLine}
                      onChange={(e) => setFormData({ ...formData, productLine: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                    >
                      <option>Agricultural &amp; Spices (Ch 06-24)</option>
                      <option>Textiles &amp; Apparel (Ch 50-63)</option>
                      <option>Chemicals, APIs &amp; Pharma (Ch 28-38)</option>
                      <option>Engineering &amp; Machinery (Ch 84-85)</option>
                      <option>Ceramics, Tiles &amp; Stones (Ch 68-70)</option>
                      <option>Other / Multi-commodity</option>
                    </select>
                  </div>
                </div>

                {/* Features of interest */}
                <div>
                  <label className="block text-[var(--brass)] uppercase mb-2 font-bold">
                    What would you like to see during the demo?
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      "Foreign Buyers Search & Verification",
                      "Nexus 2.0 Supply Chain Mapping",
                      "Competitor Shipment Surveillance",
                      "Port Analytics & Freight Dwell Times",
                      "Human Verified Director Contacts",
                      "Raw Bill of Lading Downloads"
                    ].map((feat) => {
                      const isChecked = formData.selectedFeatures.includes(feat);
                      return (
                        <button
                          key={feat}
                          type="button"
                          onClick={() => handleFeatureToggle(feat)}
                          className={`flex items-center gap-2 rounded border p-2.5 text-left transition ${
                            isChecked
                              ? "border-[var(--brass)] bg-[var(--ink)] text-[var(--paper)]"
                              : "border-[var(--brass)]/20 bg-[var(--ink)]/40 text-[var(--muted)] hover:border-[var(--brass)]/50"
                          }`}
                        >
                          <span className={isChecked ? "text-emerald-400 font-bold" : "text-[var(--muted)]"}>
                            {isChecked ? "☑" : "☐"}
                          </span>
                          <span>{feat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time slot picker */}
                <div>
                  <label className="block text-[var(--brass)] uppercase mb-2 font-bold">
                    Select Convenient Time Slot (30 Mins)
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded border p-2.5 text-left transition ${
                          selectedSlot === slot
                            ? "border-[var(--brass)] bg-[var(--brass)] text-[var(--ink)] font-bold shadow"
                            : "border-[var(--brass)]/20 bg-[var(--ink)] text-[var(--paper)] hover:border-[var(--brass)]"
                        }`}
                      >
                        🕒 {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded bg-[var(--brass)] py-3.5 font-mono text-xs uppercase tracking-widest text-[var(--ink)] font-bold hover:brightness-110 shadow-xl"
                >
                  Confirm &amp; Schedule Live 1-on-1 Demo →
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
