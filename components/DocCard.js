export default function DocCard({ code, title, children }) {
  return (
    <article className="doc-card">
      {code && (
        <span className="absolute right-5 top-5 rounded-sm bg-[var(--ink)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--brass)]">
          {code}
        </span>
      )}
      <h3 className="font-display text-xl text-[var(--ink)]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">{children}</p>
    </article>
  );
}
