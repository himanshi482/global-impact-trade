"use client";

import { useState } from "react";
import FieldLabel from "../../components/FieldLabel";
import Link from "next/link";

const GLOBAL_OFFICES = [
  {
    city: "Hyderabad, India (Global HQ)",
    address: "Kapil Towers, Financial District, Nanakramguda, Hyderabad, Telangana 500032",
    phone: "+91 40 6810 9999",
    email: "india.exim@globebridge.co",
    hours: "Mon - Fri: 09:30 - 18:30 IST"
  },
  {
    city: "Mumbai, India (Maritime Logistics Hub)",
    address: "Nariman Point Business Chambers, Free Press Journal Marg, Mumbai 400021",
    phone: "+91 22 4915 8100",
    email: "mumbai.port@globebridge.co",
    hours: "Mon - Sat: 09:00 - 19:00 IST"
  },
  {
    city: "Dubai, United Arab Emirates (MENA Hub)",
    address: "JAFZA One, Tower A, Jebel Ali Free Zone, Dubai, UAE",
    phone: "+971 4 881 9400",
    email: "dubai@globebridge.co",
    hours: "Mon - Fri: 08:30 - 17:30 GST"
  },
  {
    city: "London, United Kingdom (Europe Liaison)",
    address: "Canary Wharf Trade Centre, 25 Bank Street, London E14 5JP",
    phone: "+44 20 7946 0912",
    email: "europe@globebridge.co",
    hours: "Mon - Fri: 09:00 - 17:00 GMT"
  }
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    inquiryType: "Buyer Discovery & Leads",
    message: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen">
      {/* Hero Banner */}
      <section className="border-b border-[var(--brass)]/20 bg-gradient-to-b from-[var(--ink-2)] to-[var(--ink)] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <FieldLabel>Connect with Trade Specialists</FieldLabel>
          <h1 className="font-display max-w-3xl text-4xl text-[var(--paper)] md:text-6xl">
            Let&rsquo;s accelerate your global trade operations.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-[var(--muted)] leading-relaxed md:text-lg">
            Have questions about customs shipment records, buyer verification, or high-volume ocean freight routing? Our EXIM advisors are ready to assist.
          </p>
        </div>
      </section>

      {/* Main Contact Grid */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl grid gap-12 lg:grid-cols-12">
          {/* Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 md:p-8 shadow-2xl">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--brass)]">
                Direct Trade Inquiry
              </span>
              <h2 className="font-display mt-2 text-2xl text-[var(--paper)] md:text-3xl">
                Send a Message to Our Desk
              </h2>

              {submitted ? (
                <div className="mt-6 rounded-lg bg-emerald-950/70 border border-emerald-500/40 p-8 text-center">
                  <span className="text-4xl">✉️</span>
                  <h3 className="font-display mt-3 text-2xl text-emerald-300">
                    Thank You, {formData.name || "Valued Exporter"}!
                  </h3>
                  <p className="mt-2 text-xs font-mono text-[var(--paper)] leading-relaxed">
                    Your inquiry regarding <strong>{formData.inquiryType}</strong> has been assigned to our senior regional trade specialist. We will respond within 4 business hours to <strong>{formData.email}</strong>.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 rounded bg-[var(--brass)] px-6 py-2.5 font-mono text-xs uppercase tracking-wider text-[var(--ink)] font-bold"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4 font-mono text-xs">
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
                      <label className="block text-[var(--muted)] uppercase mb-1">Business Email *</label>
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
                      <label className="block text-[var(--muted)] uppercase mb-1">Phone / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 94915 81000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--muted)] uppercase mb-1">Company / Enterprise</label>
                      <input
                        type="text"
                        placeholder="Global Exports Pvt Ltd"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Inquiry Purpose</label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                    >
                      <option>Buyer Discovery &amp; Leads</option>
                      <option>Trade Data &amp; Customs API Subscription</option>
                      <option>Export Readiness Consultation</option>
                      <option>Freight Forwarding &amp; Customs Clearance</option>
                      <option>Supplier Audit &amp; Ethical Verification</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[var(--muted)] uppercase mb-1">Requirement Details *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Specify your HS code, target exporting countries, or dataset requirements..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded bg-[var(--brass)] py-3 font-mono text-xs uppercase tracking-widest text-[var(--ink)] font-bold hover:brightness-110 shadow-lg"
                  >
                    Submit Trade Inquiry →
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Office Locations */}
          <div className="lg:col-span-5 space-y-6">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--brass)]">
              Global Presence
            </span>
            <h2 className="font-display text-2xl text-[var(--paper)]">
              Trade Hubs &amp; Operational Centres
            </h2>

            <div className="space-y-4">
              {GLOBAL_OFFICES.map((off) => (
                <div
                  key={off.city}
                  className="rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)] p-5 font-mono text-xs space-y-1.5"
                >
                  <h3 className="font-display text-base text-[var(--paper)]">{off.city}</h3>
                  <p className="text-[var(--muted)] text-[11px]">{off.address}</p>
                  <div className="mt-2 pt-2 border-t border-[var(--brass)]/10 flex flex-wrap gap-4 text-[var(--brass)]">
                    <span>📞 {off.phone}</span>
                    <span>✉️ {off.email}</span>
                  </div>
                  <p className="text-[10px] text-[var(--muted)]">🕒 {off.hours}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
