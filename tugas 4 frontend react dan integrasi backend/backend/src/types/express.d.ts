import type { AuthUser } from '../services/tokenService.ts';

/**
 * Augmentasi tipe Express secara global:
 * - user      : diisi `authenticate` setelah cookie sesi diverifikasi
 * - requestId : diisi `requestId` middleware, dikirim ke client & ditulis ke log
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId?: string;
    }
  }
}

export {};
