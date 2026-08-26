import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--brass)]/20 bg-[var(--ink-2)] px-6 py-16 text-[var(--muted)]">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-5">
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-2 font-display text-2xl text-[var(--paper)]">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-[var(--brass)] font-mono text-xs font-bold text-[var(--ink)]">
              GB
            </span>
            <span>
              GLOBE<span className="text-[var(--brass)]">BRIDGE</span>
            </span>
          </Link>
          <p className="max-w-sm text-sm leading-relaxed">
            The modern AI-powered platform for Global Trade Analysis, foreign buyers discovery, customs shipment data from 181+ countries, and ethical fair-trade supply chains.
          </p>
          <div className="pt-2 font-mono text-xs text-[var(--paper)]">
            <p>Direct EXIM Hotline: <span className="text-[var(--brass)]">+91 40 6810 9999</span></p>
            <p className="mt-1">Inquiry Desk: <span className="text-[var(--brass)]">trade@globebridge.co</span></p>
          </div>
        </div>

        {/* Trade Tools Column */}
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--brass)] font-bold">
            EXIM Intelligence
          </p>
          <ul className="mt-4 space-y-2.5 font-mono text-xs">
            <li><Link href="/trade-data" className="hover:text-[var(--paper)]">Global Trade Data</Link></li>
            <li><Link href="/export-potential-test" className="hover:text-[var(--paper)]">Export Potential Test</Link></li>
            <li><Link href="/hs-codes" className="hover:text-[var(--paper)]">HS Code Chapter List</Link></li>
            <li><Link href="/market-analysis" className="hover:text-[var(--paper)]">World Market Trends</Link></li>
            <li><Link href="/hs-codes" className="hover:text-[var(--paper)]">Landed Cost Calculator</Link></li>
          </ul>
        </div>

        {/* Solutions Column */}
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--brass)] font-bold">
            Platform &amp; Tools
          </p>
          <ul className="mt-4 space-y-2.5 font-mono text-xs">
            <li><Link href="/login" className="text-[var(--brass)] hover:underline">Client Sign In</Link></li>
            <li><Link href="/register" className="text-emerald-400 hover:underline">Create Free Account</Link></li>
            <li><Link href="/features" className="hover:text-[var(--paper)]">Features Overview</Link></li>
            <li><Link href="/plans-pricing" className="hover:text-[var(--paper)]">Plans &amp; Pricing</Link></li>
            <li><Link href="/book-a-demo" className="hover:text-[var(--paper)]">Book a Demo</Link></li>
          </ul>
        </div>

        {/* Company Column */}
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--brass)] font-bold">
            Company &amp; Hubs
          </p>
          <ul className="mt-4 space-y-2.5 font-mono text-xs">
            <li><Link href="/about-us" className="hover:text-[var(--paper)]">About GlobeBridge</Link></li>
            <li><Link href="/about-us" className="hover:text-[var(--paper)]">Social Impact &amp; CSR</Link></li>
            <li><Link href="/contact" className="hover:text-[var(--paper)]">Contact &amp; Global Offices</Link></li>
            <li><span className="text-[var(--muted)]">📍 Hyderabad · Mumbai</span></li>
            <li><span className="text-[var(--muted)]">📍 Dubai · London</span></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-7xl border-t border-[var(--brass)]/15 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[11px] text-[var(--muted)]">
        <p>
          © 2026 GlobeBridge Exports &amp; Trade Intelligence Ltd. All rights reserved.
        </p>
        <div className="flex gap-6">
          <Link href="/contact" className="hover:text-[var(--paper)]">Terms of Service</Link>
          <Link href="/contact" className="hover:text-[var(--paper)]">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-[var(--paper)]">Customs Compliance</Link>
        </div>
      </div>
    </footer>
  );
}
