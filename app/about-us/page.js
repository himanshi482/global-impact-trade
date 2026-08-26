import FieldLabel from "../../components/FieldLabel";
import Seal from "../../components/Seal";
import Link from "next/link";

export const metadata = {
  title: "About Us — Driving Global Trade with Trust & Impact | GlobeBridge",
  description:
    "GlobeBridge Exports combines AI-powered global trade intelligence with ethical sourcing, verified supplier networks, and social impact programs across 181 countries.",
};

export default function AboutUsPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Banner */}
      <section className="border-b border-[var(--brass)]/20 bg-gradient-to-b from-[var(--ink-2)] to-[var(--ink)] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <FieldLabel>About GlobeBridge Exports &amp; Trade Intel</FieldLabel>
          <h1 className="font-display max-w-4xl text-4xl text-[var(--paper)] md:text-6xl">
            Pioneering the next era of ethical, AI-driven global commerce.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-[var(--muted)] leading-relaxed md:text-lg">
            From verified factory audits and multi-tier supply chain mapping to women-empowerment cooperatives and carbon-conscious freight routing — we make global export-import seamless, transparent, and mutually beneficial.
          </p>
        </div>
      </section>

      {/* Mission & Vision Strip */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl grid gap-10 md:grid-cols-2 items-center">
          <div>
            <FieldLabel>Our Guiding Philosophy</FieldLabel>
            <h2 className="font-display text-3xl text-[var(--paper)] md:text-4xl">
              Connecting emerging producers to premier international buyers.
            </h2>
            <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
              International trade should not be locked behind opaque middlemen or questionable counterparty risk. We build data transparency directly into the physical supply chain, pairing deep customs intelligence with certified on-ground audit teams.
            </p>
            <div className="mt-8 space-y-4 font-mono text-xs text-[var(--paper)]">
              <div className="rounded-lg bg-[var(--ink-2)] p-4 border-l-2 border-[var(--brass)]">
                <strong className="text-[var(--brass)]">Our Vision:</strong> To empower 100,000+ small, medium, and large enterprises to trade globally with zero counterparty default risk by 2030.
              </div>
              <div className="rounded-lg bg-[var(--ink-2)] p-4 border-l-2 border-emerald-400">
                <strong className="text-emerald-400">Our Mission:</strong> Democratize access to actionable EXIM customs intelligence, fair-trade certified sourcing, and efficient multimodal ocean freight.
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-10 text-center">
            <Seal text="VERIFIED" sub="Fair Trade & Ethical Origin" />
            <h3 className="font-display mt-6 text-2xl text-[var(--paper)]">
              Social Responsibility at Every Port
            </h3>
            <p className="mt-2 text-xs text-[var(--muted)] max-w-sm leading-relaxed">
              60% of our domestic sourcing partners are women-led cooperatives and rural artisan clusters, audited under strict fair wage and zero child-labor standards.
            </p>
          </div>
        </div>
      </section>

      {/* Global Impact Numbers */}
      <section className="border-t border-b border-[var(--brass)]/20 bg-[var(--ink-2)] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 font-mono text-center">
            <div className="rounded-xl bg-[var(--ink)] p-6 border border-[var(--brass)]/20">
              <p className="font-display text-4xl font-bold text-[var(--brass)]">181+</p>
              <p className="text-xs text-[var(--muted)] mt-2 uppercase tracking-wider">Countries Connected</p>
            </div>
            <div className="rounded-xl bg-[var(--ink)] p-6 border border-[var(--brass)]/20">
              <p className="font-display text-4xl font-bold text-[var(--brass)]">23 Mn+</p>
              <p className="text-xs text-[var(--muted)] mt-2 uppercase tracking-wider">Verified Entity Profiles</p>
            </div>
            <div className="rounded-xl bg-[var(--ink)] p-6 border border-[var(--brass)]/20">
              <p className="font-display text-4xl font-bold text-[var(--brass)]">$120M+</p>
              <p className="text-xs text-[var(--muted)] mt-2 uppercase tracking-wider">Trade Value Facilitated</p>
            </div>
            <div className="rounded-xl bg-[var(--ink)] p-6 border border-[var(--brass)]/20">
              <p className="font-display text-4xl font-bold text-emerald-400">99.8%</p>
              <p className="text-xs text-[var(--muted)] mt-2 uppercase tracking-wider">On-Time Clearance Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership & Advisory */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <FieldLabel>Leadership &amp; Trade Advisory</FieldLabel>
          <h2 className="font-display text-3xl text-[var(--paper)] md:text-4xl">
            Steered by veterans of international trade &amp; customs law
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Capt. Rajeshwar Varma",
                role: "Managing Director & Chief Maritime Strategist",
                desc: "32 years in international container shipping, former Port Operations Director at JNPT and Dubai Port World.",
                origin: "Mumbai / Dubai"
              },
              {
                name: "Dr. Ananya Sen",
                role: "Head of EXIM Data Intelligence & AI",
                desc: "PhD in Econometrics from London School of Economics; specialized in trade flow forecasting and tariff policy analysis.",
                origin: "New Delhi / London"
              },
              {
                name: "Marcus Lindqvist",
                role: "VP of European Procurement & FairTrade Compliance",
                desc: "18 years spearheading ethical supply chains across Nordic retail giants and organic certification boards.",
                origin: "Gothenburg, Sweden"
              }
            ].map((p) => (
              <div
                key={p.name}
                className="rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-6 flex flex-col justify-between"
              >
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--brass)]">
                    📍 {p.origin}
                  </span>
                  <h3 className="font-display mt-2 text-xl text-[var(--paper)]">{p.name}</h3>
                  <p className="mt-1 font-mono text-xs text-emerald-400">{p.role}</p>
                  <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
