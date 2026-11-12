import type { CookieOptions, Response } from 'express';
import { env, isProduction } from '../config/env.ts';
import { getTokenMaxAge } from '../services/tokenService.ts';

// httpOnly   : JavaScript di browser TIDAK bisa membaca cookie ini (tahan XSS).
// sameSite   : 'lax' — cookie tidak ikut dikirim dari situs lain pada request mutasi.
// secure     : hanya lewat HTTPS saat production.
const baseOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  path: '/',
};

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(env.authCookieName, token, { ...baseOptions, maxAge: getTokenMaxAge(token) });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(env.authCookieName, baseOptions);
}
