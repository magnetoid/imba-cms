import preset from '@imba/tailwind-preset'

/** Pilot app: reuse the @imba preset (which maps cine.* colors to our redefined
 *  --cine-* vars) but override the font stack to mtiosavljevic's Inter + JetBrains. */
export default {
  presets: [preset],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/*/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
}
