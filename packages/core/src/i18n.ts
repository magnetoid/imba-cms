import i18next, { type i18n } from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Locale } from './types'

export function initI18n(opts: {
  defaultLocale: Locale
  resources: Record<Locale, Record<string, Record<string, string>>>
}): i18n {
  void i18next.use(initReactI18next).init({
    lng: opts.defaultLocale,
    fallbackLng: opts.defaultLocale,
    resources: opts.resources,
    interpolation: { escapeValue: false },
  })
  return i18next
}
