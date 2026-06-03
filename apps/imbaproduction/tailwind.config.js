import preset from '@imba/tailwind-preset'

export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/*/src/**/*.{ts,tsx}',
  ],
}
