import type { Request, Response } from 'express';
import { AuthService } from '../services/authService.ts';
import { getUser } from '../middlewares/auth.ts';
import { getValidated } from '../middlewares/validate.ts';
import { clearAuthCookie, setAuthCookie } from '../utils/cookie.ts';
import type { LoginInput, RegisterInput } from '../schemas/authSchema.ts';

/**
 * Register, login, dan logout TIDAK memakai middleware authenticate — di
 * endpoint login-lah sesi dibuat. Error apa pun dari service diteruskan Express 5
 * ke errorHandler tanpa try/catch.
 */
export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService = new AuthService()) {
    this.authService = authService;
  }

  register = async (_req: Request, res: Response): Promise<void> => {
    const body = getValidated<RegisterInput>(res, 'body');
    const user = await this.authService.register(body);

    // Sengaja TIDAK memasang cookie: user diarahkan ke login agar toast
    // "pendaftaran berhasil" dan "login berhasil" tetap terpisah.
    res.status(201).json({
      status: 'success',
      message: 'Akun berhasil dibuat. Silakan masuk.',
      data: user,
    });
  };

  login = async (_req: Request, res: Response): Promise<void> => {
    const body = getValidated<LoginInput>(res, 'body');
    const { token, user } = await this.authService.login(body);

    setAuthCookie(res, token);
    res.status(200).json({ status: 'success', message: 'Berhasil masuk ke Maem Bolo.', data: user });
  };

  /** Memulihkan sesi saat frontend dimuat. Data diambil ulang dari database. */
  me = async (req: Request, res: Response): Promise<void> => {
    const { id } = getUser(req);
    const data = await this.authService.me(id);
    res.status(200).json({ status: 'success', data });
  };

  logout = (_req: Request, res: Response): void => {
    clearAuthCookie(res);
    res.status(200).json({ status: 'success', message: 'Berhasil keluar.', data: { loggedOut: true } });
  };
}
