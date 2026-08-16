import { useEffect, useState } from 'react'

export interface AsyncContent<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Loads CMS content once per `key`. The plugin clients already fall back to
 * their built-in defaults on error, so `error` is only ever set when even the
 * fallback threw — a genuine bug, not a missing row.
 */
export function useAsyncContent<T>(load: () => Promise<T>, key: string): AsyncContent<T> {
  const [state, setState] = useState<AsyncContent<T>>({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ data: null, loading: true, error: null })
    load().then(
      (data) => { if (!cancelled) setState({ data, loading: false, error: null }) },
      (error: unknown) => {
        if (!cancelled) setState({ data: null, loading: false, error: error instanceof Error ? error.message : String(error) })
      },
    )
    return () => { cancelled = true }
    // `load` is a fresh closure every render; `key` is what identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return state
}
