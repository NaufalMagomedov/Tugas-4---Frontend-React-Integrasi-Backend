import type { AxiosResponse } from 'axios'
import type {
  LoginPayload,
  MenuItem,
  MenuPayload,
  PageMeta,
  RegisterPayload,
  ReportSummary,
  Review,
  ReviewPayload,
  Stall,
  StallPayload,
  StallQuery,
  User,
} from '../types/api'
import { ApiError } from './errors'
import { http } from './http'

export { API_BASE_URL } from './http'

interface Envelope<T> {
  status: 'success'
  message?: string
  meta?: PageMeta
  data: T
}

/** Memastikan respons sesuai kontrak { status: 'success', data } sebelum dipakai. */
function unwrap<T>(response: AxiosResponse<unknown>): Envelope<T> {
  const payload = response.data

  if (
    typeof payload !== 'object' ||
    payload === null ||
    (payload as { status?: unknown }).status !== 'success' ||
    !('data' in payload)
  ) {
    throw new ApiError(response.status, 'INVALID_RESPONSE', 'Format respons server tidak sesuai kesepakatan.')
  }

  return payload as Envelope<T>
}

async function data<T>(request: Promise<AxiosResponse<unknown>>): Promise<T> {
  return unwrap<T>(await request).data
}

async function result<T>(request: Promise<AxiosResponse<unknown>>, fallback: string) {
  const envelope = unwrap<T>(await request)
  return { message: envelope.message ?? fallback, data: envelope.data }
}

async function list<T>(request: Promise<AxiosResponse<unknown>>, label: string): Promise<T[]> {
  const items = await data<T[]>(request)
  if (!Array.isArray(items)) throw new ApiError(200, 'INVALID_RESPONSE', `Daftar ${label} tidak valid.`)
  return items
}

/* ---------------------------------- Auth ---------------------------------- */

export const register = (payload: RegisterPayload) =>
  result<User>(http.post('/auth/register', payload), 'Akun berhasil dibuat. Silakan masuk.')

export const login = (payload: LoginPayload) => data<User>(http.post('/auth/login', payload))
export const getCurrentUser = () => data<User>(http.get('/auth/me'))
export const getProfile = () => data<User>(http.get('/auth/profile'))

export async function logout(): Promise<void> {
  await http.post('/auth/logout')
}

/* --------------------------------- Stalls --------------------------------- */

export async function getStalls(query: StallQuery = {}): Promise<{ items: Stall[]; meta: PageMeta }> {
  const envelope = unwrap<Stall[]>(
    await http.get('/stalls', {
      // Parameter kosong tidak dikirim: backend menolak `limit=` sebagai bukan angka.
      params: Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== '')),
    }),
  )

  if (!Array.isArray(envelope.data) || !envelope.meta) {
    throw new ApiError(200, 'INVALID_RESPONSE', 'Daftar warung tidak valid.')
  }

  return { items: envelope.data, meta: envelope.meta }
}

export const getCategories = () => list<string>(http.get('/stalls/categories'), 'kategori')
export const getMyStalls = () => list<Stall>(http.get('/stalls/mine'), 'warung')
export const getStall = (id: number) => data<Stall>(http.get(`/stalls/${id}`))

export const createStall = (payload: StallPayload) =>
  result<Stall>(http.post('/stalls', payload), 'Warung berhasil dibuat.')

export const updateStall = (id: number, payload: StallPayload) =>
  result<Stall>(http.put(`/stalls/${id}`, payload), 'Warung berhasil diperbarui.')

export const deleteStall = (id: number) => result<Stall>(http.delete(`/stalls/${id}`), 'Warung berhasil dihapus.')

/* ---------------------------------- Menus --------------------------------- */

export const getStallMenus = (stallId: number) => list<MenuItem>(http.get(`/stalls/${stallId}/menus`), 'menu')

export const createMenu = (stallId: number, payload: MenuPayload) =>
  result<MenuItem>(http.post(`/stalls/${stallId}/menus`, payload), 'Menu berhasil ditambahkan.')

export const updateMenu = (id: number, payload: MenuPayload) =>
  result<MenuItem>(http.put(`/menus/${id}`, payload), 'Menu berhasil diperbarui.')

export async function deleteMenu(id: number): Promise<void> {
  await http.delete(`/menus/${id}`) // 204 No Content: tidak ada body untuk di-unwrap
}

/* --------------------------------- Reviews -------------------------------- */

export const getStallReviews = (stallId: number) => list<Review>(http.get(`/stalls/${stallId}/reviews`), 'review')

export const createReview = (stallId: number, payload: ReviewPayload) =>
  result<Review>(http.post(`/stalls/${stallId}/reviews`, payload), 'Review berhasil dikirim.')

export async function deleteReview(id: number): Promise<void> {
  await http.delete(`/reviews/${id}`)
}

/* ---------------------------------- Admin --------------------------------- */

export const getReport = () => data<ReportSummary>(http.get('/admin/reports'))

/* -------------------------------- Unggahan -------------------------------- */

/**
 * Mengunggah file gambar dan mengembalikan URL absolut yang siap disimpan
 * sebagai `imageUrl`. Body dikirim apa adanya (bukan multipart), sehingga
 * backend cukup memakai `express.raw` tanpa dependensi tambahan.
 */
export async function uploadImage(file: File): Promise<string> {
  const uploaded = await data<{ url: string }>(
    http.post('/uploads', file, {
      headers: { 'Content-Type': file.type },
      // Unggahan bisa lebih lama dari timeout default 10 detik di koneksi lambat.
      timeout: 30_000,
    }),
  )

  return uploaded.url
}
