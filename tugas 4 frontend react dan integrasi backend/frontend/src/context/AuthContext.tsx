/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { getCurrentUser, login as loginRequest, logout as logoutRequest, register as registerRequest } from '../lib/api'
import { UNAUTHORIZED_EVENT } from '../lib/http'
import type { LoginPayload, RegisterPayload, User } from '../types/api'

interface AuthContextValue {
  user: User | null
  /** false selama sesi masih diperiksa lewat GET /auth/me. */
  isReady: boolean
  login: (input: LoginPayload) => Promise<User>
  register: (input: RegisterPayload) => Promise<string>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Sesi hidup di cookie httpOnly yang dikelola backend. Frontend hanya menyimpan
 * data user di memori dan memulihkannya lewat /auth/me saat halaman dimuat —
 * tidak ada token di localStorage.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let active = true

    // Dikirim interceptor Axios saat endpoint terlindungi membalas 401.
    const handleUnauthorized = () => {
      if (active) setUser(null)
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)

    getCurrentUser()
      .then((current) => {
        if (active) setUser(current)
      })
      .catch(() => {
        // 401 = belum login. Error jaringan juga membuat area terlindungi
        // tertutup sampai sesi benar-benar bisa diverifikasi.
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setIsReady(true)
      })

    return () => {
      active = false
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    }
  }, [])

  const login = useCallback(async (input: LoginPayload) => {
    const loggedIn = await loginRequest(input)
    setUser(loggedIn)
    return loggedIn
  }, [])

  // Backend tidak membuat sesi saat register; kembalikan pesan sukses dari server.
  const register = useCallback(async (input: RegisterPayload) => (await registerRequest(input)).message, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(() => ({ user, isReady, login, register, logout }), [user, isReady, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth harus dipakai di dalam AuthProvider.')
  return context
}
