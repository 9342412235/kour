export function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="border border-line p-5 bg-bg">
      <div className="flex items-center justify-between mb-3">
        <span className="eyebrow text-muted">{label}</span>
        {Icon && <Icon size={16} className="text-muted" />}
      </div>
      <div className="font-display text-3xl">{value}</div>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  )
}

const TONE = {
  // semantic intent mapped to monochrome treatments only — weight/fill
  // differences carry meaning instead of color
  positive: 'border-ink',
  warning: 'border-dashed',
  neutral: 'border-line',
  filled: 'bg-ink text-bg border-ink',
}

export function Pill({ children, tone = 'neutral' }) {
  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border ${TONE[tone]}`}>
      {children}
    </span>
  )
}

export function statusTone(status) {
  const s = status.toLowerCase()
  if (['delivered', 'resolved', 'active', 'published', 'paid'].includes(s)) return 'filled'
  if (['cancelled', 'closed', 'disabled', 'overdue', 'unpaid'].includes(s)) return 'warning'
  return 'neutral'
}
