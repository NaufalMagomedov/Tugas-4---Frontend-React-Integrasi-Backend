import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

/**
 * Setiap request mendapat id yang dikirim ke client (header X-Request-Id dan
 * body error) dan ditulis ke log server. Saat pengguna melapor "ada error",
 * id inilah yang dicari di log.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.header('x-request-id')?.trim();
  const valid = incoming && incoming.length <= 100 && /^[\w.-]+$/.test(incoming);
  const id = valid ? incoming : randomUUID();

  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};
