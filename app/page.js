"use client";

import Link from "next/link";
import FieldLabel from "../components/FieldLabel";
import { useAuth } from "../context/AuthContext";

const stats = [
  { n: "181+", l: "Countries Connected" },
  { n: "23 Mn+", l: "Verified Entity Profiles" },
  { n: "450+", l: "Global Ports Tracked" },
  { n: "$120M+", l: "Ethical Trade Facilitated" },
];

const clientLogos = [
  "Dabur Global",
  "Bikanervala Foods",
  "CavinKare Export",
  "DCM Shriram",
  "Divis Labs",
  "Tata International",
  "Emirates Food Hub",
  "Nordic Wholesale"
];

const unlockableFeatures = [
  {
    icon: "🌍",
    title: "Global Foreign Buyers Discovery",
    desc: "Instant access to active verified importers across 181+ countries with direct decision-maker contact details."
  },
  {
    icon: "🚢",
    title: "Live Customs Shipment Manifests",
    desc: "Real-time Bill of Lading feeds, declared CIF/FOB values, container counts, and port of origin/discharge."
  },
  {
    icon: "📊",
    title: "Export Potential & Readiness Test",
    desc: "5-pillar algorithmic assessment benchmarked against global trade demand with bespoke market recommendations."
  },
  {
    icon: "📑",
    title: "99 HS Chapters & Tariff Calculator",
    desc: "Harmonized System directory with automated Basic Customs Duty (BCD), SWS, IGST, and RoDTEP export calculations."
  },
  {
    icon: "🕸️",
    title: "Nexus 2.0 Supply Chain Mapping",
    desc: "Multi-tier network mapping revealing competitor supplier bases, freight forwarders, and trade routes."
  },
  {
    icon: "📈",
    title: "World Market Analytics & Port Index",
    desc: "Commodity growth rates, container dwell times, and vessel turnaround congestion indices."
  }
];

const portalRoutes = [
  { label: "Buyer Discovery", href: "/buyer-discovery", desc: "Access verified global importers & foreign procurement contacts", bg: "from-blue-700/40 to-blue-950/60 border-blue-500/40 text-blue-400 hover:border-blue-400", btn: "bg-blue-600 hover:bg-blue-500 text-white" },
  { label: "Supplier Discovery", href: "/supplier-discovery", desc: "Discover active manufacturers, exporters & supply chain partners", bg: "from-indigo-700/40 to-indigo-950/60 border-indigo-500/40 text-indigo-400 hover:border-indigo-400", btn: "bg-indigo-600 hover:bg-indigo-500 text-white" },
  { label: "My Leads", href: "/my-leads", desc: "Track, manage, and contact your unlocked enterprise leads", bg: "from-emerald-700/40 to-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:border-emerald-400", btn: "bg-emerald-600 hover:bg-emerald-500 text-white" },
  { label: "Admin Leads", href: "/admin/leads", desc: "Admin portal for lead inventory, unlock approvals & pipeline", bg: "from-purple-700/40 to-purple-950/60 border-purple-500/40 text-purple-400 hover:border-purple-400", btn: "bg-purple-600 hover:bg-purple-500 text-white" },
];

export default function Home() {
  const { user: currentUser } = useAuth();

  return (
    <main className="min-h-screen">
      {/* HERO SECTION */}
      <section className="border-b border-[var(--brass)]/20 bg-gradient-to-b from-[var(--ink-2)] via-[var(--ink)] to-[var(--ink)] px-6 pb-16 pt-16 md:pt-24">
        <div className="mx-auto max-w-6xl text-center">
          
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brass)]/40 bg-[var(--brass)]/10 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-[var(--brass)]">
            <span>🌐</span> Global Import-Export Trade Intelligence
          </div>

          <h1 className="font-display mx-auto mt-6 max-w-4xl text-4xl leading-[1.08] text-[var(--paper)] md:text-6xl lg:text-7xl">
            Empower your EXIM business with AI-driven trade intelligence.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted)] md:text-lg">
            Discover verified foreign buyers, track competitor shipments, and calculate customs tariffs across 181+ countries. Register your business to unlock full platform access.
          </p>

          {/* Quick Hub Navigation Cards */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto text-left">
            {portalRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={`group flex flex-col justify-between rounded-xl border bg-gradient-to-b p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${route.bg}`}
              >
                <div>
                  <h3 className="font-display text-lg text-[var(--paper)] group-hover:text-[var(--brass)] transition flex items-center justify-between">
                    <span>{route.label}</span>
                    <span className="text-xs font-mono opacity-60 group-hover:translate-x-1 transition-transform">→</span>
                  </h3>
                  <p className="mt-2 text-xs font-mono text-[var(--muted)] leading-relaxed">{route.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10">
                  <span className={`inline-block w-full py-2 px-3 text-center text-xs font-mono font-bold rounded shadow transition ${route.btn}`}>
                    Open {route.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Primary Action Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {currentUser ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/dashboard"
                  className="rounded bg-[var(--brass)] px-8 py-4 font-mono text-xs uppercase tracking-widest text-[var(--ink)] font-bold transition hover:brightness-110 shadow-xl"
                >
                  Open EXIM Portal Dashboard ({currentUser.name}) →
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="rounded bg-[var(--brass)] px-8 py-4 font-mono text-xs uppercase tracking-widest text-[var(--ink)] font-bold transition hover:brightness-110 shadow-xl"
                >
                  Register Free (7-Day Trial) →
                </Link>
                <Link
                  href="/login"
                  className="rounded border border-[var(--brass)]/40 px-7 py-4 font-mono text-xs uppercase tracking-widest text-[var(--paper)] transition hover:border-[var(--brass)] hover:text-[var(--brass)]"
                >
                  Existing Member Sign In
                </Link>
                <Link
                  href="/book-a-demo"
                  className="rounded border border-[var(--paper)]/20 px-6 py-4 font-mono text-xs uppercase tracking-widest text-[var(--muted)] transition hover:text-[var(--paper)]"
                >
                  Book 1-on-1 Demo
                </Link>
              </div>
            )}
          </div>

          {/* Quick Stats Manifest Strip */}
          <div className="manifest-strip mx-auto mt-16 max-w-4xl font-mono text-[var(--paper)] bg-[var(--ink-2)]/80">
            {stats.map((s) => (
              <div key={s.l}>
                <p className="font-display text-3xl font-bold text-[var(--brass)]">{s.n}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS: 3-STEP ONBOARDING */}
      <section className="px-6 py-20 bg-[var(--ink)]">
        <div className="mx-auto max-w-6xl text-center">
          <FieldLabel>Simple 3-Step Process</FieldLabel>
          <h2 className="font-display mt-2 text-3xl text-[var(--paper)] md:text-4xl">
            How to get started with GlobeBridge EXIM
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--muted)]">
            Create your registered account in under 60 seconds and launch your global export journey.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-3 text-left">
            <div className="rounded-2xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brass)] font-mono text-base font-bold text-[var(--ink)]">
                01
              </span>
              <h3 className="font-display mt-5 text-2xl text-[var(--paper)]">Register Account</h3>
              <p className="mt-2 text-xs font-mono text-[var(--muted)] leading-relaxed">
                Click the register button, select your business entity type, enter your product category, and activate your 7-day free trial.
              </p>
              <div className="mt-6 pt-4 border-t border-[var(--brass)]/15">
                <Link href="/register" className="font-mono text-xs text-[var(--brass)] font-bold hover:underline">
                  Go to Register Page →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brass)] font-mono text-base font-bold text-[var(--ink)]">
                02
              </span>
              <h3 className="font-display mt-5 text-2xl text-[var(--paper)]">Instant App Access</h3>
              <p className="mt-2 text-xs font-mono text-[var(--muted)] leading-relaxed">
                Your credentials instantly unlock the full EXIM App Dashboard containing live buyer databases, manifests, and HS directories.
              </p>
              <div className="mt-6 pt-4 border-t border-[var(--brass)]/15">
                <span className="font-mono text-xs text-emerald-400">✓ Instant Activation</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brass)] font-mono text-base font-bold text-[var(--ink)]">
                03
              </span>
              <h3 className="font-display mt-5 text-2xl text-[var(--paper)]">Close Global Orders</h3>
              <p className="mt-2 text-xs font-mono text-[var(--muted)] leading-relaxed">
                Contact verified overseas procurement directors directly via phone/WhatsApp and dispatch shipments with confidence.
              </p>
              <div className="mt-6 pt-4 border-t border-[var(--brass)]/15">
                <span className="font-mono text-xs text-[var(--brass)]">181+ Active Markets</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT UNLOCKS AFTER REGISTRATION */}
      <section className="border-t border-b border-[var(--brass)]/20 bg-[var(--ink-2)] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--brass)] font-bold">
              ★ Platform Capabilities
            </span>
            <h2 className="font-display mt-2 text-3xl text-[var(--paper)] md:text-4xl">
              What unlocks inside the app after registration?
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--muted)]">
              All proprietary intelligence tools become available in your personalized dashboard upon creating an account.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {unlockableFeatures.map((f) => (
              <div
                key={f.title}
                className="flex flex-col justify-between rounded-xl border border-[var(--brass)]/20 bg-[var(--ink)] p-6 transition hover:border-[var(--brass)]"
              >
                <div>
                  <span className="text-3xl">{f.icon}</span>
                  <h3 className="font-display mt-3 text-xl text-[var(--paper)]">{f.title}</h3>
                  <p className="mt-2 text-xs font-mono text-[var(--muted)] leading-relaxed">{f.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--brass)]/15 flex items-center justify-between font-mono text-xs">
                  <span className="text-[10px] uppercase text-emerald-400">● Unlocks on Register</span>
                  <Link href="/register" className="text-[var(--brass)] hover:underline">
                    Register →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CIRCLE OF TRUST */}
      <section className="px-6 py-14 bg-[var(--ink)] border-b border-[var(--brass)]/20">
        <div className="mx-auto max-w-6xl text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--brass)]">
            Trusted by 45,000+ Active Exporters, Importers &amp; Logistics Leaders
          </span>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {clientLogos.map((logo) => (
              <div
                key={logo}
                className="rounded-lg border border-[var(--brass)]/20 bg-[var(--ink-2)] px-4 py-2.5 font-mono text-xs font-semibold text-[var(--paper)]/80"
              >
                🏢 {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className="px-6 py-20 bg-gradient-to-b from-[var(--ink)] to-[var(--ink-2)]">
        <div className="mx-auto max-w-5xl rounded-3xl border border-[var(--brass)]/40 bg-[var(--ink-2)] p-8 md:p-14 shadow-2xl text-center">
          <span className="inline-block rounded-full bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 font-mono text-xs text-emerald-400 font-bold">
            No Credit Card Required · Instant 7-Day Access
          </span>
          <h2 className="font-display mt-4 text-3xl md:text-5xl text-[var(--paper)]">
            Ready to expand your products into 181+ global markets?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm font-mono text-[var(--muted)] leading-relaxed">
            Create your free account now to search verified buyers, assess your export readiness, and download trade manifests.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4 font-mono text-xs">
            <Link
              href="/register"
              className="rounded bg-[var(--brass)] px-8 py-4 uppercase tracking-widest text-[var(--ink)] font-bold hover:brightness-110 shadow-xl"
            >
              Register Account Now →
            </Link>
            <Link
              href="/login"
              className="rounded border border-[var(--brass)]/40 px-7 py-4 uppercase tracking-widest text-[var(--paper)] hover:border-[var(--brass)]"
            >
              Member Sign In
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
