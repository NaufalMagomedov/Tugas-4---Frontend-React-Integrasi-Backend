import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { ProfileController } from '../controllers/profileController.ts';
import { validate } from '../middlewares/validate.ts';
import { authenticate } from '../middlewares/auth.ts';
import { loginSchema, registerSchema } from '../schemas/authSchema.ts';

const authRouter = Router();
const authController = new AuthController();
const profileController = new ProfileController();

// Route publik: register & login. Tidak boleh ada authenticate di sini karena
// sesi justru dibuat oleh endpoint login.
authRouter.post('/register', validate(registerSchema, 'body', 'Data pendaftaran tidak valid.'), authController.register);
authRouter.post('/login', validate(loginSchema, 'body', 'Data login tidak valid.'), authController.login);
authRouter.post('/logout', authController.logout);

// Route terlindungi. Satu cookie sesi valid dipakai untuk endpoint apa pun yang butuh "siapa kamu".
authRouter.get('/me', authenticate, authController.me);
authRouter.get('/profile', authenticate, profileController.getProfile);

export { authRouter };
