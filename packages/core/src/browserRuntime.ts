type RuntimeConfigMap = Readonly<Record<string, string | undefined>>

declare global {
  interface Window {
    __IMBA_RUNTIME_CONFIG__?: RuntimeConfigMap
  }
}

function readRuntimeConfig(): RuntimeConfigMap | undefined {
  if (typeof window === 'undefined') return undefined
  return window.__IMBA_RUNTIME_CONFIG__
}

export function readBrowserRuntimeValue(key: string, fallback = ''): string {
  const runtimeValue = readRuntimeConfig()?.[key]
  if (typeof runtimeValue === 'string' && runtimeValue.trim().length > 0) {
    return runtimeValue
  }
  return fallback
}

export function readBrowserRuntimeOptionalValue(key: string, fallback?: string): string | undefined {
  const runtimeValue = readRuntimeConfig()?.[key]
  if (typeof runtimeValue === 'string' && runtimeValue.trim().length > 0) {
    return runtimeValue
  }
  return fallback
}
