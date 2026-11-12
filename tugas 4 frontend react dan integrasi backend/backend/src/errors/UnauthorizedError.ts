import { AppError } from './AppError.ts';

/**
 * 401 = "siapa kamu?" belum terjawab: belum login, cookie hilang, token salah
 * tanda tangan, atau kedaluwarsa. Bedakan dari 403 (ForbiddenError).
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Silakan login terlebih dahulu.', code = 'UNAUTHORIZED') {
    super(401, code, message);
    this.name = 'UnauthorizedError';
  }
}
