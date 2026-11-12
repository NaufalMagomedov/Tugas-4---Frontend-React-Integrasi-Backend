import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { toApiError, type ApiError } from '../lib/errors'

interface Result<T> {
  key: string
  data?: T
  error?: ApiError
}

/**
 * Memuat data dari API dengan state loading / error / data yang konsisten.
 * - `deps` : perubahan nilai memicu muat ulang (mis. halaman, kata kunci)
 * - `reload`: dipanggil tombol "Coba lagi" atau setelah mutasi
 * Data lama tetap tampil selama muat ulang (tidak berkedip saat pindah halaman).
 */
export function useApiData<T>(fetcher: () => Promise<T>, deps: DependencyList) {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState<Result<T>>()
  const fetcherRef = useRef(fetcher)
  const key = `${JSON.stringify(deps)}#${version}`

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let active = true

    fetcherRef.current().then(
      (data) => {
        if (active) setResult({ key, data })
      },
      (error: unknown) => {
        if (active) setResult({ key, error: toApiError(error) })
      },
    )

    // Respons dari request lama diabaikan bila deps sudah berubah.
    return () => {
      active = false
    }
  }, [key])

  const reload = useCallback(() => setVersion((current) => current + 1), [])

  return {
    data: result?.data,
    error: result?.key === key ? result.error : undefined,
    isLoading: result?.key !== key,
    reload,
  }
}
