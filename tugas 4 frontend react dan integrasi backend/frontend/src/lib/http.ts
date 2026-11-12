import axios from 'axios'
import { toApiError } from './errors'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000/api/v1'
).replace(/\/+$/, '')

export const UNAUTHORIZED_EVENT = 'auth:unauthorized'

export const http = axios.create({
  baseURL: API_BASE_URL,
  // Wajib agar browser mengirim & menerima cookie sesi httpOnly lintas origin.
  withCredentials: true,
  timeout: 10_000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
})

/**
 * Titik tunggal penanganan error HTTP. Setiap error Axios diubah menjadi
 * ApiError. 401 dari endpoint terlindungi (bukan login/register/me) berarti
 * sesi habis di tengah pemakaian: AuthProvider diberi tahu lewat event.
 * 403 TIDAK menghapus sesi — user tetap login, hanya tidak berhak.
 */
http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    const url = axios.isAxiosError(error) ? (error.config?.url ?? '') : ''
    const isAuthProbe = ['/auth/me', '/auth/login', '/auth/register'].some((path) => url.includes(path))

    if (apiError.status === 401 && !isAuthProbe) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }

    return Promise.reject(apiError)
  },
)
