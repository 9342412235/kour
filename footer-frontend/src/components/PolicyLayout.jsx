/**
 * PolicyLayout
 * Shared shell for all long-form text pages.
 * Quince-style: generous whitespace, serif display headline,
 * muted eyebrow tag, clean left-aligned prose.
 */
export default function PolicyLayout({ eyebrow, title, lastUpdated, children }) {
  return (
    <main className="max-w-3xl mx-auto px-6 md:px-0 py-16 md:py-24">
      {eyebrow && (
        <p className="eyebrow text-muted mb-5">{eyebrow}</p>
      )}
      <h1 className="font-display text-4xl md:text-5xl font-light leading-[1.1] text-ink mb-4">
        {title}
      </h1>
      {lastUpdated && (
        <p className="text-xs text-muted mb-12 font-mono">{lastUpdated}</p>
      )}
      <div className="border-t border-line mb-12" />
      <div className="policy-prose">
        {children}
      </div>
    </main>
  )
}
