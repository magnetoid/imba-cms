// jsdom does not implement matchMedia, which framer-motion's useReducedMotion
// (and our own reduced-motion guards) rely on. Polyfill a stable no-op so the
// PublicLayout / Home render tests can mount components that use motion.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}
