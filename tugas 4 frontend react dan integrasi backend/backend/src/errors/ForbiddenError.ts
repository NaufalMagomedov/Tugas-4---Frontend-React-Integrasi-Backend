import { AppError, type ErrorDetail } from './AppError.ts';

/**
 * 403 = "kamu tahu siapa aku, tapi aku tidak boleh." Token valid, tetapi role
 * atau kepemilikan resource tidak cukup. `code` dibedakan per sebab:
 * FORBIDDEN (role), STALL_FORBIDDEN, MENU_FORBIDDEN, REVIEW_FORBIDDEN.
 */
export class ForbiddenError extends AppError {
  constructor(
    message = 'Anda tidak memiliki akses ke operasi ini.',
    code = 'FORBIDDEN',
    details?: ErrorDetail[],
  ) {
    super(403, code, message, details);
    this.name = 'ForbiddenError';
  }
}
