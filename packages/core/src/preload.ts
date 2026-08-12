interface SessionStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface PreloadRuntimeTarget {
  addEventListener(type: string, listener: EventListener): void
  removeEventListener(type: string, listener: EventListener): void
  location: {
    reload(): void
  }
  sessionStorage?: SessionStorageLike
}

const PRELOAD_RELOAD_KEY = 'imba:vite-preload-reload'

function readGuard(storage?: SessionStorageLike): string | null {
  try {
    return storage?.getItem(PRELOAD_RELOAD_KEY) ?? null
  } catch {
    return null
  }
}

function writeGuard(storage: SessionStorageLike | undefined, value: string) {
  try {
    storage?.setItem(PRELOAD_RELOAD_KEY, value)
  } catch {
    // Ignore storage failures and fall back to a plain reload.
  }
}

function clearGuard(storage?: SessionStorageLike) {
  try {
    storage?.removeItem(PRELOAD_RELOAD_KEY)
  } catch {
    // Ignore storage failures and continue booting the app.
  }
}

export function registerVitePreloadReload(target?: PreloadRuntimeTarget): () => void {
  const runtimeTarget = target ?? (typeof window !== 'undefined' ? window : undefined)
  if (!runtimeTarget) return () => {}

  if (readGuard(runtimeTarget.sessionStorage) === 'pending') {
    clearGuard(runtimeTarget.sessionStorage)
  }

  const onPreloadError: EventListener = (event) => {
    if (readGuard(runtimeTarget.sessionStorage) === 'pending') {
      return
    }

    writeGuard(runtimeTarget.sessionStorage, 'pending')

    const preloadEvent = event as Event & { preventDefault?: () => void }
    preloadEvent.preventDefault?.()
    runtimeTarget.location.reload()
  }

  runtimeTarget.addEventListener('vite:preloadError', onPreloadError)

  return () => {
    runtimeTarget.removeEventListener('vite:preloadError', onPreloadError)
  }
}
