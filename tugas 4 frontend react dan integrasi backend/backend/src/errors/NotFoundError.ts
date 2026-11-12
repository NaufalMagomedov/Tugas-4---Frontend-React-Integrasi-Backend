import { AppError, type ErrorDetail } from './AppError.ts';

/** 404 untuk resource yang tidak ada. Contoh code: STALL_NOT_FOUND, MENU_NOT_FOUND. */
export class NotFoundError extends AppError {
  constructor(message = 'Data tidak ditemukan.', code = 'NOT_FOUND', details?: ErrorDetail[]) {
    super(404, code, message, details);
    this.name = 'NotFoundError';
  }
}
