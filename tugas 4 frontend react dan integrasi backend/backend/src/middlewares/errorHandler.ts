import type { ErrorRequestHandler, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, type ErrorDetail } from '../errors/AppError.ts';
import { isForeignKeyViolation, isUniqueViolation } from '../utils/sqlError.ts';

/**
 * Satu-satunya tempat error diubah menjadi respons HTTP. Kontraknya selalu:
 *
 *   { status: 'fail' | 'error', code, message, errors?, requestId }
 *
 * - 4xx -> status "fail"  (kesalahan client; detail boleh ditampilkan)
 * - 5xx -> status "error" (kesalahan server; detail TIDAK dibocorkan)
 */
function sendError(
  req: Request,
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: ErrorDetail[],
): void {
  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    code,
    message,
    ...(details !== undefined && details.length > 0 ? { errors: details } : {}),
    requestId: req.requestId,
  });
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const parseError = error as Error & { status?: number; type?: string };

  // 1) Body JSON rusak / terlalu besar — dilempar express.json sebelum router.
  if (error instanceof SyntaxError && parseError.type === 'entity.parse.failed') {
    return sendError(req, res, 400, 'INVALID_JSON', 'JSON pada body tidak valid.');
  }
  if (parseError.type === 'entity.too.large') {
    return sendError(req, res, 413, 'PAYLOAD_TOO_LARGE', 'Body request terlalu besar.');
  }

  // 2) Error aplikasi yang disengaja (ValidationError, NotFoundError, ...).
  //    Semuanya turunan AppError, jadi satu cabang cukup.
  if (error instanceof AppError) {
    return sendError(req, res, error.statusCode, error.code, error.message, error.details);
  }

  // 3) ZodError yang lolos tanpa middleware validate (jaga-jaga).
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));
    return sendError(req, res, 400, 'VALIDATION_ERROR', 'Data yang dikirim tidak valid.', details);
  }

  // 4) Pelanggaran constraint SQL Server (lihat utils/sqlError.ts).
  if (isUniqueViolation(error)) {
    return sendError(req, res, 409, 'CONFLICT', 'Data bentrok dengan data yang sudah ada.');
  }
  if (isForeignKeyViolation(error)) {
    return sendError(req, res, 409, 'CONFLICT', 'Data masih berhubungan dengan data lain.');
  }

  // 5) Fallback: error tak terduga. Stack trace hanya ke log, bersama requestId.
  console.error(`[${req.requestId ?? 'no-request-id'}] Unhandled error:`, error);
  return sendError(req, res, 500, 'INTERNAL_ERROR', 'Terjadi kesalahan pada server.');
};
