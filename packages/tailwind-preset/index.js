/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        cine: {
          bg: 'var(--cine-bg)',
          surface: 'var(--cine-surface)',
          'surface-2': 'var(--cine-surface-2)',
          text: 'var(--cine-text)',
          dim: 'var(--cine-dim)',
          faint: 'var(--cine-faint)',
          accent: 'var(--cine-accent)',
          'accent-soft': 'var(--cine-accent-soft)',
          hairline: 'var(--cine-hairline)',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter Tight"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderColor: {
        DEFAULT: 'var(--cine-hairline)',
      },
    },
  },
}
