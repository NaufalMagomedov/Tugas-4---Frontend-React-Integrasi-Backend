import type { RequestHandler } from 'express';
import { env } from '../config/env.ts';
import { ForbiddenError } from '../errors/ForbiddenError.ts';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Lapisan pertahanan CSRF tambahan untuk autentikasi berbasis cookie.
 * Request yang mengubah data dan membawa header `Origin` dari situs lain
 * ditolak. Request tanpa `Origin` (curl, Postman, server-ke-server) tetap lolos
 * karena bukan serangan lewat browser.
 */
export function buildOriginGuard(allowed: string[]): RequestHandler {
  const allowedOrigins = new Set(allowed);

  return (req, _res, next) => {
    if (!unsafeMethods.has(req.method)) return next();

    const origin = req.headers.origin;
    if (!origin || allowedOrigins.has(origin)) return next();

    return next(new ForbiddenError('Origin request tidak diizinkan.', 'ORIGIN_FORBIDDEN'));
  };
}

export const originGuard: RequestHandler = buildOriginGuard([
  env.corsOrigin,
  `http://localhost:${env.port}`,
  `http://127.0.0.1:${env.port}`,
]);
