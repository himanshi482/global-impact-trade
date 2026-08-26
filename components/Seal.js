export default function Seal({ text = "VERIFIED", sub = "FAIR TRADE ORIGIN" }) {
  return (
    <div className="relative inline-flex h-36 w-36 shrink-0 -rotate-6 items-center justify-center rounded-full border-2 border-dashed border-[var(--seal)] text-[var(--seal)]">
      <div className="absolute inset-2 rounded-full border border-[var(--seal)]/50" />
      <div className="text-center leading-none">
        <p className="font-display text-lg">{text}</p>
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.15em]">{sub}</p>
      </div>
    </div>
  );
}
