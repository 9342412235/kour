import { useTheme } from '../context/ThemeContext'

const STEPS = [
  { key: 'light', label: 'Light', swatch: '#ffffff' },
  { key: 'medium', label: 'Medium', swatch: '#c9c7c2' },
  { key: 'dark', label: 'Dark', swatch: '#0c0c0b' },
]

// The signature element: three tone swatches in a hairline pill, the
// active one lifted with a ring. Reads instantly as "this product cares
// about shades of grey" without saying so.
export default function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-line p-1 ${className}`}
      role="group"
      aria-label="Theme"
    >
      {STEPS.map((s) => (
        <button
          key={s.key}
          onClick={() => setTheme(s.key)}
          aria-label={`${s.label} theme`}
          aria-pressed={theme === s.key}
          title={s.label}
          className="relative h-6 w-6 rounded-full border transition-transform duration-200"
          style={{
            background: s.swatch,
            borderColor: theme === s.key ? 'var(--ink)' : 'var(--line)',
            transform: theme === s.key ? 'scale(1.08)' : 'scale(1)',
            boxShadow: theme === s.key ? '0 0 0 2px var(--bg), 0 0 0 3px var(--ink)' : 'none',
          }}
        />
      ))}
    </div>
  )
}
