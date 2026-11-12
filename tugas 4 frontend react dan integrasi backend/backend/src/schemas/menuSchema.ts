import { z } from './z.ts';
import { imageUrlSchema } from './imageUrl.ts';

export const MENU_PRICE_MAX = 1_000_000;

// Tipe data diperiksa KETAT (tanpa coerce): "price": "5000" (string) ditolak.
// Frontend yang benar mengirim angka sungguhan.
export const createMenuSchema = z
  .object({
    name: z
      .string({ required_error: 'name wajib diisi', invalid_type_error: 'name harus berupa teks' })
      .trim()
      .min(2, 'name minimal 2 karakter')
      .max(100, 'name maksimal 100 karakter')
      .openapi({ example: 'Es Jeruk', description: 'Nama menu' }),
    price: z
      .number({ required_error: 'price wajib diisi', invalid_type_error: 'price harus berupa angka' })
      .int('price harus bilangan bulat')
      .min(1, 'price harus lebih dari 0')
      .max(MENU_PRICE_MAX, 'price maksimal 1.000.000')
      .openapi({ example: 5000, description: 'Harga dalam rupiah' }),
    isAvailable: z
      .boolean({ invalid_type_error: 'isAvailable harus true atau false' })
      .default(true)
      .openapi({ example: true, description: 'Status ketersediaan' }),
    imageUrl: imageUrlSchema,
  })
  .strict({ message: 'body hanya boleh berisi name, price, isAvailable, dan imageUrl' });

export const updateMenuSchema = createMenuSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'minimal satu field harus diisi');

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
