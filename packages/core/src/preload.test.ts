import { describe, expect, it, vi } from 'vitest'
import { registerVitePreloadReload } from './preload'

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))

  return {
    getItem(key: string) {
      return values.get(key) ?? null
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
    removeItem(key: string) {
      values.delete(key)
    },
  }
}

function createRuntimeTarget(storage = createStorage()) {
  const listeners = new Map<string, EventListener>()
  const reload = vi.fn()

  return {
    target: {
      addEventListener(type: string, listener: EventListener) {
        listeners.set(type, listener)
      },
      removeEventListener(type: string, listener: EventListener) {
        if (listeners.get(type) === listener) {
          listeners.delete(type)
        }
      },
      location: { reload },
      sessionStorage: storage,
    },
    listeners,
    reload,
    storage,
  }
}

describe('registerVitePreloadReload', () => {
  it('reloads once and prevents the default preload error behavior', () => {
    const runtime = createRuntimeTarget()
    const dispose = registerVitePreloadReload(runtime.target)
    const preventDefault = vi.fn()

    runtime.listeners.get('vite:preloadError')?.({
      preventDefault,
    } as unknown as Event)

    expect(preventDefault).toHaveBeenCalledTimes(1)
    expect(runtime.reload).toHaveBeenCalledTimes(1)
    expect(runtime.storage.getItem('imba:vite-preload-reload')).toBe('pending')

    dispose()
    expect(runtime.listeners.has('vite:preloadError')).toBe(false)
  })

  it('skips repeated reloads while the recovery guard is still pending', () => {
    const runtime = createRuntimeTarget(createStorage({
      'imba:vite-preload-reload': 'pending',
    }))

    registerVitePreloadReload(runtime.target)

    expect(runtime.storage.getItem('imba:vite-preload-reload')).toBe(null)

    const preventDefault = vi.fn()
    runtime.listeners.get('vite:preloadError')?.({
      preventDefault,
    } as unknown as Event)

    expect(preventDefault).toHaveBeenCalledTimes(1)
    expect(runtime.reload).toHaveBeenCalledTimes(1)

    runtime.listeners.get('vite:preloadError')?.({
      preventDefault,
    } as unknown as Event)

    expect(preventDefault).toHaveBeenCalledTimes(1)
    expect(runtime.reload).toHaveBeenCalledTimes(1)
  })
})
