import type { Request, Response } from 'express';

/** Menangkap rute yang tidak dikenal dan membalas 404 dengan kontrak error yang sama. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: 'fail',
    code: 'ROUTE_NOT_FOUND',
    message: `Route tidak ditemukan: ${req.method} ${req.originalUrl}`,
    requestId: req.requestId,
  });
}
