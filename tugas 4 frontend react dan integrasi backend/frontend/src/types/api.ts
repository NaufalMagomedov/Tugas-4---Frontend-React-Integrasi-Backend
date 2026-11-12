export type UserRole = 'admin' | 'owner' | 'customer'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
}

export interface LoginPayload {
  email: string
  password: string
}

/** Dikirim ke backend. `confirmPassword` hanya ada di form, tidak ikut dikirim. */
export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface Stall {
  id: number
  ownerId: number
  name: string
  category: string | null
  location: string | null
  description: string | null
  imageUrl: string | null
  avgRating: number
  reviewCount: number
  isPopular: boolean
}

export interface StallPayload {
  name: string
  category: string | null
  location: string | null
  description: string | null
  imageUrl: string | null
}

export interface MenuItem {
  id: number
  stallId: number
  name: string
  price: number
  isAvailable: boolean
  imageUrl: string | null
}

export interface MenuPayload {
  name: string
  price: number
  isAvailable: boolean
  imageUrl: string | null
}

export interface Review {
  id: number
  stallId: number
  userId: number
  userName: string
  rating: number
  comment: string | null
  likeCount: number
  createdAt: string | null
}

export interface ReviewPayload {
  rating: number
  comment: string | null
}

export interface StallQuery {
  search?: string
  category?: string
  page?: number
  limit?: number
}

export interface PageMeta {
  page: number
  limit: number
  total: number
}

export interface ReportSummary {
  totalUsers: number
  totalStalls: number
  totalReviews: number
  averageRating: number
  stallsByCategory: Array<{ category: string | null; total: number }>
}

export function homeForRole(role: UserRole): string {
  if (role === 'owner') return '/owner'
  if (role === 'admin') return '/admin'
  return '/'
}
