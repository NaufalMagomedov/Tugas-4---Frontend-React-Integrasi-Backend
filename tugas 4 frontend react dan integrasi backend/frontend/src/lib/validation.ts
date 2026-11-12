import type { MenuPayload, ReviewPayload, StallPayload } from '../types/api'

/**
 * Validasi sisi browser = untuk PENGALAMAN PENGGUNA (umpan balik cepat, tidak
 * mengirim request yang jelas salah). Validasi backend (zod) tetap otoritatif
 * karena request bisa dikirim lewat curl/Postman tanpa melewati file ini.
 * Angka batas di sini SAMA dengan schema backend.
 */

export type FormErrors<T extends string> = Partial<Record<T, string>>

/** Mengembalikan field pertama yang salah, untuk memindahkan fokus saat submit. */
export function firstErrorField<T extends string>(errors: FormErrors<T>, order: readonly T[]): T | null {
  return order.find((field) => errors[field] !== undefined) ?? null
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const EMAIL_MAX = 150
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72
export const IMAGE_URL_MAX = 500
export const IMAGE_URL_PATTERN = /^https?:\/\/\S+$/i

const isDigits = (value: string): boolean => /^\d+$/.test(value)

/** Validasi field gambar opsional; string kosong berarti "tanpa gambar". */
function validateImageUrl(raw: string): string | undefined {
  const value = raw.trim()
  if (!value) return undefined
  if (value.length > IMAGE_URL_MAX) return `URL gambar maksimal ${IMAGE_URL_MAX} karakter.`
  if (!IMAGE_URL_PATTERN.test(value)) return 'URL gambar harus diawali http:// atau https://.'
  return undefined
}

/* ---------------------------------- Login --------------------------------- */

export interface LoginFormValues {
  email: string
  password: string
}
export type LoginField = keyof LoginFormValues
export const LOGIN_FIELDS: readonly LoginField[] = ['email', 'password']
export const EMPTY_LOGIN: LoginFormValues = { email: '', password: '' }

function validateEmail(raw: string): string | undefined {
  const email = raw.trim()
  if (!email) return 'Email wajib diisi.'
  if (email.length > EMAIL_MAX) return `Email maksimal ${EMAIL_MAX} karakter.`
  if (!EMAIL_PATTERN.test(email)) return 'Format email tidak valid.'
  return undefined
}

export function validateLoginForm(values: LoginFormValues): FormErrors<LoginField> {
  const errors: FormErrors<LoginField> = {}
  const email = validateEmail(values.email)
  if (email) errors.email = email

  // Saat login password hanya dicek tidak kosong; aturan kekuatan khusus register.
  if (!values.password) errors.password = 'Password wajib diisi.'
  else if (values.password.length > PASSWORD_MAX) errors.password = `Password maksimal ${PASSWORD_MAX} karakter.`

  return errors
}

/* -------------------------------- Register -------------------------------- */

export interface RegisterFormValues {
  name: string
  email: string
  password: string
  confirmPassword: string
}
export type RegisterField = keyof RegisterFormValues
export const REGISTER_FIELDS: readonly RegisterField[] = ['name', 'email', 'password', 'confirmPassword']
export const EMPTY_REGISTER: RegisterFormValues = { name: '', email: '', password: '', confirmPassword: '' }

export interface PasswordCheck {
  label: string
  valid: boolean
}

export function passwordChecks(password: string): PasswordCheck[] {
  return [
    { label: `Minimal ${PASSWORD_MIN} karakter`, valid: password.length >= PASSWORD_MIN },
    { label: `Maksimal ${PASSWORD_MAX} karakter`, valid: password.length > 0 && password.length <= PASSWORD_MAX },
    { label: 'Mengandung huruf', valid: /[A-Za-z]/.test(password) },
    { label: 'Mengandung angka', valid: /[0-9]/.test(password) },
  ]
}

export function validateRegisterForm(values: RegisterFormValues): FormErrors<RegisterField> {
  const errors: FormErrors<RegisterField> = {}
  const name = values.name.trim()

  if (!name) errors.name = 'Nama wajib diisi.'
  else if (name.length < 3) errors.name = 'Nama minimal 3 karakter.'
  else if (name.length > 100) errors.name = 'Nama maksimal 100 karakter.'

  const email = validateEmail(values.email)
  if (email) errors.email = email

  const { password } = values
  if (!password) errors.password = 'Password wajib diisi.'
  else if (password.length < PASSWORD_MIN) errors.password = `Password minimal ${PASSWORD_MIN} karakter.`
  else if (password.length > PASSWORD_MAX) errors.password = `Password maksimal ${PASSWORD_MAX} karakter.`
  else if (!/[A-Za-z]/.test(password)) errors.password = 'Password harus mengandung huruf.'
  else if (!/[0-9]/.test(password)) errors.password = 'Password harus mengandung angka.'

  if (!values.confirmPassword) errors.confirmPassword = 'Konfirmasi password wajib diisi.'
  else if (values.confirmPassword !== password) errors.confirmPassword = 'Konfirmasi password tidak sama.'

  return errors
}

/* ---------------------------------- Warung -------------------------------- */

export interface StallFormValues {
  name: string
  category: string
  location: string
  description: string
  imageUrl: string
}
export type StallField = keyof StallFormValues
export const STALL_FIELDS: readonly StallField[] = ['name', 'category', 'location', 'description', 'imageUrl']
export const EMPTY_STALL: StallFormValues = { name: '', category: '', location: '', description: '', imageUrl: '' }

export function validateStallForm(values: StallFormValues): FormErrors<StallField> {
  const errors: FormErrors<StallField> = {}
  const name = values.name.trim()

  if (!name) errors.name = 'Nama warung wajib diisi.'
  else if (name.length < 3) errors.name = 'Nama warung minimal 3 karakter.'
  else if (name.length > 100) errors.name = 'Nama warung maksimal 100 karakter.'

  if (values.category.trim().length > 50) errors.category = 'Kategori maksimal 50 karakter.'
  if (values.location.trim().length > 100) errors.location = 'Lokasi maksimal 100 karakter.'
  if (values.description.trim().length > 1000) errors.description = 'Deskripsi maksimal 1000 karakter.'
  const imageUrl = validateImageUrl(values.imageUrl)
  if (imageUrl) errors.imageUrl = imageUrl

  return errors
}

/** Field opsional yang dikosongkan dikirim sebagai null, bukan string kosong. */
export function toStallPayload(values: StallFormValues): StallPayload {
  const optional = (value: string) => value.trim() || null
  return {
    name: values.name.trim(),
    category: optional(values.category),
    location: optional(values.location),
    description: optional(values.description),
    imageUrl: optional(values.imageUrl),
  }
}

/* ----------------------------------- Menu ---------------------------------- */

export const MENU_PRICE_MAX = 1_000_000

export interface MenuFormValues {
  name: string
  price: string
  isAvailable: boolean
  imageUrl: string
}
export type MenuField = 'name' | 'price' | 'imageUrl'
export const MENU_FIELDS: readonly MenuField[] = ['name', 'price', 'imageUrl']
export const EMPTY_MENU: MenuFormValues = { name: '', price: '', isAvailable: true, imageUrl: '' }

export function validateMenuForm(values: MenuFormValues): FormErrors<MenuField> {
  const errors: FormErrors<MenuField> = {}
  const name = values.name.trim()

  if (!name) errors.name = 'Nama menu wajib diisi.'
  else if (name.length < 2) errors.name = 'Nama menu minimal 2 karakter.'
  else if (name.length > 100) errors.name = 'Nama menu maksimal 100 karakter.'

  // Harga diperiksa sebagai TEKS mentah: "abc", "-1000", "1.5", "1e3" ditolak
  // eksplisit, dan harga kosong tidak diam-diam berubah menjadi 0.
  const price = values.price.trim()
  if (!price) errors.price = 'Harga wajib diisi.'
  else if (!isDigits(price)) errors.price = 'Harga harus berupa angka bulat tanpa titik, koma, atau tanda minus.'
  else if (Number(price) <= 0) errors.price = 'Harga harus lebih dari 0.'
  else if (Number(price) > MENU_PRICE_MAX) errors.price = `Harga maksimal Rp${MENU_PRICE_MAX.toLocaleString('id-ID')}.`

  const imageUrl = validateImageUrl(values.imageUrl)
  if (imageUrl) errors.imageUrl = imageUrl

  return errors
}

export function toMenuPayload(values: MenuFormValues): MenuPayload {
  return {
    name: values.name.trim(),
    price: Number(values.price.trim()),
    isAvailable: values.isAvailable,
    imageUrl: values.imageUrl.trim() || null,
  }
}

/* --------------------------------- Review ---------------------------------- */

export interface ReviewFormValues {
  rating: number
  comment: string
}
export type ReviewField = 'rating' | 'comment'
export const EMPTY_REVIEW: ReviewFormValues = { rating: 0, comment: '' }

export function validateReviewForm(values: ReviewFormValues): FormErrors<ReviewField> {
  const errors: FormErrors<ReviewField> = {}

  if (!Number.isInteger(values.rating) || values.rating < 1 || values.rating > 5) {
    errors.rating = 'Pilih rating 1 sampai 5 bintang.'
  }
  if (values.comment.trim().length > 1000) errors.comment = 'Komentar maksimal 1000 karakter.'

  return errors
}

export function toReviewPayload(values: ReviewFormValues): ReviewPayload {
  return { rating: values.rating, comment: values.comment.trim() || null }
}
