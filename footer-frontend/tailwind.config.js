/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:        'var(--bg)',
        surface:   'var(--surface)',
        'surface-2':'var(--surface-2)',
        ink:       'var(--ink)',
        muted:     'var(--muted)',
        line:      'var(--line)',
        accent:    'var(--accent)',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
