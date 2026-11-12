import { z } from './z.ts';

export const IMAGE_URL_MAX = 500;

const isHttpUrl = (value: string): boolean => /^https?:\/\/\S+$/i.test(value);

/**
 * URL gambar opsional untuk warung/menu.
 *
 * Kenapa hanya http/https:
 * - `javascript:` dan `data:` lolos `new URL()` tetapi berbahaya bila dipakai
 *   sebagai `src` gambar (XSS / payload besar).
 * - String kosong diterima lalu dinormalisasi menjadi null oleh repository,
 *   sehingga form yang dikosongkan benar-benar menghapus gambar.
 */
export const imageUrlSchema = z
  .string({ invalid_type_error: 'imageUrl harus berupa teks' })
  .trim()
  .max(IMAGE_URL_MAX, `imageUrl maksimal ${IMAGE_URL_MAX} karakter`)
  .refine((value) => value === '' || isHttpUrl(value), 'imageUrl harus berupa URL http/https yang valid')
  .nullable()
  .optional()
  .openapi({
    example: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=1200&q=70',
    description: 'URL gambar (opsional, hanya http/https)',
  });
