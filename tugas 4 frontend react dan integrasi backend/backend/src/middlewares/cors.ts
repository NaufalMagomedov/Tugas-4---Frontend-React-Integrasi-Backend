import type { RequestHandler } from 'express';
import { env } from '../config/env.ts';

/**
 * CORS untuk frontend di origin berbeda (localhost:5173 -> localhost:3000).
 *
 * Karena sesi memakai cookie, dua hal wajib:
 * 1. `Access-Control-Allow-Origin` harus origin SPESIFIK, bukan `*`.
 * 2. `Access-Control-Allow-Credentials: true`, dan frontend memakai
 *    `withCredentials: true`.
 */
export const corsMiddleware: RequestHandler = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', env.corsOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Request-Id');
  res.setHeader('Access-Control-Expose-Headers', 'X-Request-Id');

  // Preflight dijawab di sini dan tidak diteruskan ke router.
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
};
