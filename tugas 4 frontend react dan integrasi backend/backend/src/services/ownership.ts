import type { AuthUser } from './tokenService.ts';

/**
 * Aturan otorisasi tingkat objek (object-level authorization), dipisah dari
 * service supaya bisa diuji tanpa database.
 *
 * Role saja belum cukup: seorang "owner" hanya boleh mengelola warung (dan
 * menu di dalamnya) yang `owner_id`-nya adalah dirinya. Admin boleh semua.
 */
export function canManageStall(stallOwnerId: number, user: Pick<AuthUser, 'id' | 'role'>): boolean {
  return user.role === 'admin' || stallOwnerId === user.id;
}

/** Review boleh dihapus oleh penulisnya sendiri atau admin (moderasi). */
export function canDeleteReview(reviewUserId: number, user: Pick<AuthUser, 'id' | 'role'>): boolean {
  return user.role === 'admin' || reviewUserId === user.id;
}
