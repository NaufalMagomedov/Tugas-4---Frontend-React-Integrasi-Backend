import { z } from './z.ts';

// bcrypt hanya memproses 72 byte pertama, jadi password dibatasi di situ.
// Aturan huruf + angka sama dengan checklist password di frontend.
const registerPasswordSchema = z
  .string({ required_error: 'password wajib diisi' })
  .min(8, 'password minimal 8 karakter')
  .max(72, 'password maksimal 72 karakter')
  .regex(/[A-Za-z]/, 'password harus mengandung huruf')
  .regex(/[0-9]/, 'password harus mengandung angka');

const emailSchema = z
  .string({ required_error: 'email wajib diisi' })
  .trim()
  .toLowerCase()
  .email('format email tidak valid')
  .max(150, 'email maksimal 150 karakter');

// CATATAN: schema ini SENGAJA tidak punya field `role`. Role diberikan server
// (selalu 'customer'). .strict() menolak kunci tak dikenal, termasuk percobaan
// mengirim `role` atau `confirmPassword`.
export const registerSchema = z
  .object({
    name: z
      .string({ required_error: 'name wajib diisi' })
      .trim()
      .min(3, 'name minimal 3 karakter')
      .max(100, 'name maksimal 100 karakter'),
    email: emailSchema,
    password: registerPasswordSchema,
  })
  .strict({ message: 'body hanya boleh berisi name, email, dan password' });

export const loginSchema = z
  .object({
    email: emailSchema,
    // Saat login cukup dicek tidak kosong; aturan kekuatan hanya berlaku saat register.
    password: z
      .string({ required_error: 'password wajib diisi' })
      .min(1, 'password wajib diisi')
      .max(72, 'password maksimal 72 karakter'),
  })
  .strict({ message: 'body hanya boleh berisi email dan password' });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
