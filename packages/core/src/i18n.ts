import i18next, { type i18n } from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Locale } from './types'

/**
 * Loads plugin strings into the shared i18next instance.
 *
 * Called by the boot path (`initializeCmsRuntime`) with the registry's
 * per-locale, per-plugin bundle, so `useTranslation('<plugin name>')` resolves
 * inside any plugin component. Before this was wired, `Plugin.i18n` was
 * collected by nothing and every plugin string was dead data.
 *
 * i18next is a process-wide singleton and `init()` is not re-entrant: a second
 * call warns and resets the resource store. The admin and public apps can both
 * boot in one process (the test suite does exactly that), so a repeat call adds
 * bundles to the live instance instead.
 */
export function initI18n(opts: {
  defaultLocale: Locale
  resources: Record<Locale, Record<string, Record<string, string>>>
}): i18n {
  if (i18next.isInitialized) {
    for (const [locale, namespaces] of Object.entries(opts.resources)) {
      for (const [ns, strings] of Object.entries(namespaces)) {
        i18next.addResourceBundle(locale, ns, strings, true, true)
      }
    }
    if (i18next.language !== opts.defaultLocale) void i18next.changeLanguage(opts.defaultLocale)
    return i18next
  }

  void i18next.use(initReactI18next).init({
    lng: opts.defaultLocale,
    fallbackLng: opts.defaultLocale,
    resources: opts.resources,
    interpolation: { escapeValue: false },
    initImmediate: false,
  })
  return i18next
}
