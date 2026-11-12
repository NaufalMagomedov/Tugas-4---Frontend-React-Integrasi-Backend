import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodError, ZodTypeAny } from 'zod';
import type { ErrorDetail } from '../errors/AppError.ts';
import { ValidationError } from '../errors/ValidationError.ts';

export type RequestSource = 'body' | 'query' | 'params';

function toDetails(error: ZodError, source: RequestSource): ErrorDetail[] {
  return error.issues.map((issue) => {
    // .strict() menolak field asing. Pesannya sudah kustom di schema; fieldnya
    // dinamai sumbernya ("body") karena tidak ada satu field spesifik yang salah.
    if (issue.code === 'unrecognized_keys') {
      return { field: source, message: issue.message };
    }

    return { field: issue.path.join('.') || source, message: issue.message };
  });
}

/**
 * Middleware validasi berbasis schema zod. ZodError diubah menjadi
 * ValidationError (400, code VALIDATION_ERROR) — controller tidak perlu
 * menulis try/catch validasi sendiri. Hasil parse yang sukses (sudah di-trim,
 * di-coerce, diberi default) disimpan di `res.locals.validated[source]` dan
 * dibaca controller lewat `getValidated()`.
 */
export function validate(schema: ZodTypeAny, source: RequestSource, message?: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return next(new ValidationError(toDetails(result.error, source), message));
    }

    const validated = (res.locals.validated ?? {}) as Record<RequestSource, unknown>;
    validated[source] = result.data;
    res.locals.validated = validated;
    return next();
  };
}

/** Mengambil data hasil validasi dari satu sumber request di controller. */
export function getValidated<T>(res: Response, source: RequestSource): T {
  const validated = (res.locals.validated ?? {}) as Record<RequestSource, unknown>;
  return validated[source] as T;
}
