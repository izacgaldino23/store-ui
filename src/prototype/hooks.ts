import { useCallback, useEffect, useRef, useState } from 'react'

export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nonce, setNonce] = useState(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    fetcherRef
      .current()
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err: unknown) => {
        if (active) setError((err as { message?: string })?.message || 'Erro ao carregar dados.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((value) => value + 1), [])
  return { data, loading, error, reload, setData }
}

export function useAction<TArgs extends unknown[]>(action: (...args: TArgs) => Promise<unknown>) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const actionRef = useRef(action)
  actionRef.current = action

  const run = useCallback(async (...args: TArgs) => {
    setBusy(true)
    setError('')
    try {
      await actionRef.current(...args)
      return true
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Não foi possível concluir a ação.')
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  return { run, busy, error, clearError: () => setError('') }
}

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // tema não persiste em modo privado
    }
  }, [theme])

  return {
    theme,
    toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
  }
}

export function useDebouncedValue<T>(value: T, delay = 500) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
