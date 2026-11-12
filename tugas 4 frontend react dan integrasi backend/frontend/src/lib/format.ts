import type { UserRole } from '../types/api'

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

export const formatRupiah = (value: number): string => rupiah.format(value)
export const formatRating = (value: number): string => value.toFixed(1)

export function formatRole(role: UserRole): string {
  if (role === 'owner') return 'Pemilik Warung'
  if (role === 'admin') return 'Admin'
  return 'Pelanggan'
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'MB'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })

export function formatDate(value: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dateFormat.format(date)
}
