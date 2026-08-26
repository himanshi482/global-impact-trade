import FieldLabel from "../../components/FieldLabel";
import DocCard from "../../components/DocCard";
import Link from "next/link";

export const metadata = {
  title: "Platform Features & EXIM Intelligence Suite | GlobeBridge",
  description:
    "Explore the AI-powered tools behind GlobeBridge: Foreign Buyers Discovery, Nexus 2.0 Supply Chain Mapping, Verified Contacts, Port Analytics, and Competitor Tracking.",
};

const featureList = [
  {
    icon: "🎯",
    code: "FEAT-01",
    title: "Foreign Buyers Discovery",
    tag: "Biggest Exporter Challenge Solved",
    desc: "Direct access to active international importers across 181+ countries. Filter by HS Code, product specifications, buying frequency, and port of discharge to find ready purchasers for your goods."
  },
  {
    icon: "🏭",
    code: "FEAT-02",
    title: "Global Supplier Intelligence",
    tag: "Verified & Audited Factories",
    desc: "Discover trusted manufacturing partners and agricultural producers. Evaluate operational capacity, phytosanitary certifications, ISO standards, and historical export performance."
  },
  {
    icon: "🕸️",
    code: "FEAT-03",
    title: "Nexus 2.0 Supply Chain Mapping",
    tag: "Exclusive Multi-Tier Intel",
    desc: "Uncover end-to-end buyer-seller relationship webs. See who your buyers buy from, which freight forwarders they employ, and what alternative origins they source from during price surges."
  },
  {
    icon: "🕵️",
    code: "FEAT-04",
    title: "Competitor Tracking & Surveillance",
    tag: "Stay 3 Steps Ahead",
    desc: "Monitor rival exporters in real time. Track their monthly container counts, landed prices, destination ports, and emerging international distribution partners."
  },
  {
    icon: "📞",
    code: "FEAT-05",
    title: "Human-Verified Decision Maker Contacts",
    tag: "Direct Access",
    desc: "Skip gatekeepers. Gain verified work emails, direct mobile numbers, and LinkedIn profiles for Procurement Heads, Managing Directors, and Supply Chain Officers."
  },
  {
    icon: "🚢",
    code: "FEAT-06",
    title: "Port & Freight Lane Analytics",
    tag: "450+ Global Ports",
    desc: "Evaluate container dwell times, shipping carrier market share (Maersk, MSC, CMA CGM, Hapag Lloyd), multimodal connections, and port congestion indices."
  },
  {
    icon: "📈",
    code: "FEAT-07",
    title: "Predictive Price & Trend Benchmarking",
    tag: "DeepTech Analytics",
    desc: "Identify seasonal buying windows and unit price movements before you negotiate contracts. Know exact historical FOB vs CIF spreads across regional markets."
  },
  {
    icon: "🛡️",
    code: "FEAT-08",
    title: "Due Diligence & Counterparty Risk",
    tag: "Mitigate Financial Hazards",
    desc: "Screen foreign partners against global trade sanctions, financial solvency registers, and historical shipment dispute records to prevent bad debt."
  },
  {
    icon: "💱",
    code: "FEAT-09",
    title: "Cross-Currency & Metric Converter",
    tag: "Seamless Multi-Market Views",
    desc: "Switch effortlessly between INR, USD, EUR, and AED. Toggle figures between Lakhs/Crores and Millions/Billions, Metric Tonnes and Kilograms in a single click."
  }
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Header */}
      <section className="border-b border-[var(--brass)]/20 bg-gradient-to-b from-[var(--ink-2)] to-[var(--ink)] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl text-center">
          <FieldLabel>Platform Architecture — EXIM Super Engine</FieldLabel>
          <h1 className="font-display mx-auto mt-4 max-w-4xl text-4xl text-[var(--paper)] md:text-6xl">
            Everything you need to conquer international trade.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-[var(--muted)] leading-relaxed md:text-lg">
            Powered by 23 Million+ verified company profiles, big data algorithms, and verified customs records spanning 181 countries.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/plans-pricing"
              className="rounded bg-[var(--brass)] px-7 py-3 font-mono text-xs uppercase tracking-widest text-[var(--ink)] font-bold transition hover:brightness-110"
            >
              Explore Subscription Plans
            </Link>
            <Link
              href="/book-a-demo"
              className="rounded border border-[var(--brass)]/40 px-7 py-3 font-mono text-xs uppercase tracking-widest text-[var(--paper)] transition hover:border-[var(--brass)] hover:text-[var(--brass)]"
            >
              Request Live Platform Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Grid of 9 Core Features */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            {featureList.map((f) => (
              <div
                key={f.code}
                className="flex flex-col justify-between rounded-xl border border-[var(--brass)]/25 bg-[var(--ink-2)] p-7 transition hover:border-[var(--brass)] hover:shadow-xl group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{f.icon}</span>
                    <span className="rounded bg-[var(--ink)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--brass)] border border-[var(--brass)]/20">
                      {f.code}
                    </span>
                  </div>

                  <span className="mt-4 inline-block font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                    {f.tag}
                  </span>

                  <h3 className="font-display mt-1 text-2xl text-[var(--paper)] group-hover:text-[var(--brass)] transition">
                    {f.title}
                  </h3>

                  <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                    {f.desc}
                  </p>
                </div>

                <div className="mt-6 border-t border-[var(--brass)]/15 pt-4">
                  <Link
                    href="/trade-data"
                    className="font-mono text-xs text-[var(--brass)] hover:text-[var(--paper)] flex items-center justify-between"
                  >
                    <span>Test Feature in Live Database</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DeepTech Interactive Demo Strip */}
      <section className="border-t border-b border-[var(--brass)]/20 bg-[var(--ink-2)] px-6 py-16">
        <div className="mx-auto max-w-6xl rounded-2xl bg-[var(--ink)] border border-[var(--brass)]/30 p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--brass)]">
                Exclusive Innovation
              </span>
              <h2 className="font-display mt-2 text-3xl text-[var(--paper)] md:text-4xl">
                Say hello to Nexus 2.0
              </h2>
              <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
                Traditional trade directories only list static names. Nexus 2.0 constructs a live graph neural network connecting buyers, upstream raw material producers, logistics carriers, and port terminals.
              </p>
              <ul className="mt-6 space-y-2.5 font-mono text-xs text-[var(--paper)]">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Instant multi-tier vendor linkage mapping
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Real-time alternative supplier recommendation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Automatic alerts on competitor contract renewals
                </li>
              </ul>
            </div>

            <div className="rounded-xl bg-[var(--ink-2)] border border-[var(--brass)]/30 p-6 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[var(--brass)]/20 pb-3">
                <span className="text-[var(--brass)] font-bold">NEXUS VISUALIZER (ACTIVE)</span>
                <span className="text-emerald-400">● 100% Live Graph</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded bg-[var(--ink)] p-3 border-l-2 border-emerald-400">
                  <p className="text-[11px] text-[var(--muted)]">Target Importer Node:</p>
                  <p className="font-bold text-[var(--paper)]">Al-Futtaim Global Trade (Dubai, UAE)</p>
                </div>
                <div className="pl-6 border-l border-dashed border-[var(--brass)]/40 space-y-2">
                  <div className="rounded bg-[var(--ink)] p-2 text-[11px] flex justify-between">
                    <span>Shipper 1: Malabar Spices (India)</span>
                    <span className="text-[var(--brass)]">62% Volume</span>
                  </div>
                  <div className="rounded bg-[var(--ink)] p-2 text-[11px] flex justify-between">
                    <span>Shipper 2: Vietnam Agri Group</span>
                    <span className="text-[var(--brass)]">38% Volume</span>
                  </div>
                  <div className="rounded bg-[var(--ink)] p-2 text-[11px] flex justify-between text-emerald-400">
                    <span>Opportunity Gap: Direct Organic 550GL Supply</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl text-[var(--paper)] md:text-4xl">
            Ready to experience the next level in trade intelligence?
          </h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Schedule a personalized walkthrough with an EXIM trade data analyst.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/book-a-demo"
              className="rounded bg-[var(--brass)] px-8 py-3.5 font-mono text-xs uppercase tracking-widest text-[var(--ink)] font-bold hover:brightness-110"
            >
              Book 1-on-1 Platform Demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
