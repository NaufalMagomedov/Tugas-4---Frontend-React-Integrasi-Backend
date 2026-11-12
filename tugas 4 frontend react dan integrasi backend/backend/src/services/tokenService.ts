import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.ts';
import type { UserRole } from '../repositories/userRepository.ts';

/** Bentuk `req.user`, diisi middleware authenticate dari payload token. */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

/**
 * Membuat token JWT. Payload: sub (id), name, email, role, iat, exp.
 * JANGAN taruh password di payload — payload hanya di-encode (base64url),
 * bukan dienkripsi.
 */
export function signToken(user: AuthUser): string {
  return jwt.sign(
    { sub: String(user.id), name: user.name, email: user.email, role: user.role },
    env.jwtSecret,
    { algorithm: 'HS256', expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] },
  );
}

/**
 * Memastikan signature cocok dan token belum kedaluwarsa, lalu mengembalikan
 * AuthUser. Melempar JsonWebTokenError / TokenExpiredError kalau tidak valid.
 */
export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });

  if (typeof payload === 'string') {
    throw new jwt.JsonWebTokenError('Payload token bukan objek JSON');
  }

  const id = Number(payload.sub);
  const { name, email, role } = payload as { name?: string; email?: string; role?: UserRole };

  if (!Number.isInteger(id) || !name || !email || !role) {
    throw new jwt.JsonWebTokenError('Payload token tidak memuat data user yang lengkap');
  }

  return { id, name, email, role };
}

/**
 * Sisa umur token dalam milidetik, dipakai sebagai `maxAge` cookie supaya
 * cookie dan token kedaluwarsa bersamaan.
 */
export function getTokenMaxAge(token: string): number {
  const decoded = jwt.decode(token);
  const exp = decoded && typeof decoded === 'object' ? decoded.exp : undefined;

  if (typeof exp !== 'number') return 0;
  return Math.max(exp * 1000 - Date.now(), 0);
}
