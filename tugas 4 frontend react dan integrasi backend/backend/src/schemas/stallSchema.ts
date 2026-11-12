import { z } from './z.ts';
import { imageUrlSchema } from './imageUrl.ts';

// Parameter path /:id selalu di-coerce dari string menjadi angka.
export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: 'id harus berupa angka' })
    .int('id harus bilangan bulat')
    .positive('id harus lebih dari 0')
    .openapi({ example: 3, description: 'ID resource' }),
});

// Query parameter: search & category opsional; page/limit punya default.
export const stallQuerySchema = z.object({
  search: z.string().trim().max(100).optional().openapi({ description: 'Cari berdasarkan nama warung' }),
  category: z.string().trim().max(50).optional().openapi({ description: 'Filter kategori warung', example: 'Minuman' }),
  page: z.coerce
    .number({ invalid_type_error: 'page harus berupa angka' })
    .int('page harus bilangan bulat')
    .min(1, 'page minimal 1')
    .default(1)
    .openapi({ description: 'Nomor halaman (default 1)', example: 1 }),
  limit: z.coerce
    .number({ invalid_type_error: 'limit harus berupa angka' })
    .int('limit harus bilangan bulat')
    .min(1, 'limit minimal 1')
    .max(100, 'limit maksimal 100')
    .default(10)
    .openapi({ description: 'Jumlah data per halaman (maks 100)', example: 10 }),
});

const optionalNullableText = (max: number) =>
  z.string().trim().max(max, `maksimal ${max} karakter`).nullable().optional();

// CATATAN PENTING: tidak ada field `ownerId`. Pemilik warung ditentukan server
// dari sesi login, bukan dari body.
export const createStallSchema = z
  .object({
    name: z
      .string({ required_error: 'name wajib diisi' })
      .trim()
      .min(3, 'name minimal 3 karakter')
      .max(100, 'name maksimal 100 karakter')
      .openapi({ example: 'Warung Baru', description: 'Nama warung' }),
    category: optionalNullableText(50).openapi({ example: 'Nasi', description: 'Kategori warung' }),
    location: optionalNullableText(100).openapi({ example: 'Kantin FK', description: 'Lokasi warung' }),
    description: optionalNullableText(1000).openapi({ example: 'Nasi goreng dadakan', description: 'Deskripsi warung' }),
    imageUrl: imageUrlSchema,
  })
  .strict({ message: 'body hanya boleh berisi name, category, location, description, dan imageUrl' });

// PUT = update sebagian. Body kosong `{}` ditolak: tanpa field, query UPDATE
// tidak punya kolom untuk di-SET dan akan berakhir sebagai 500.
export const updateStallSchema = createStallSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'minimal satu field harus diisi');

export type IdParam = z.infer<typeof idParamSchema>;
export type StallQuery = z.infer<typeof stallQuerySchema>;
export type CreateStallInput = z.infer<typeof createStallSchema>;
export type UpdateStallInput = z.infer<typeof updateStallSchema>;
