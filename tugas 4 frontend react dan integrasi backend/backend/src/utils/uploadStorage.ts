import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ValidationError } from '../errors/ValidationError.ts';

/** Batas ukuran file yang diterima endpoint unggah gambar. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Folder penyimpanan gambar unggahan, relatif terhadap direktori kerja backend. */
export const uploadsDir = path.resolve(process.cwd(), 'uploads');

/** Prefix URL publik gambar unggahan (dipasang di app.ts). */
export const UPLOAD_URL_PREFIX = '/uploads';

interface ImageKind {
  mime: string;
  ext: string;
}

function startsWith(buffer: Buffer, bytes: readonly number[]): boolean {
  return bytes.every((byte, index) => buffer[index] === byte);
}

/**
 * Menentukan jenis gambar dari magic bytes, bukan dari `Content-Type` yang
 * dikirim client. Dengan begitu file yang menyamar (mis. .exe dengan header
 * image/jpeg) tetap ditolak.
 */
export function detectImageKind(buffer: Buffer): ImageKind | null {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: 'image/png', ext: 'png' };
  }
  if (startsWith(buffer, [0x47, 0x49, 0x46, 0x38])) {
    return { mime: 'image/gif', ext: 'gif' };
  }
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }

  return null;
}

/**
 * Menyimpan buffer gambar ke folder uploads dengan nama acak.
 * Mengembalikan path publik relatif, mis. `/uploads/1730000000-abcd.jpg`.
 */
export async function saveUploadedImage(buffer: Buffer): Promise<string> {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new ValidationError(
      [{ field: 'image', message: 'Kirim file gambar sebagai body biner dengan Content-Type image/*.' }],
      'File gambar tidak ditemukan pada body request.',
    );
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new ValidationError(
      [{ field: 'image', message: 'Ukuran gambar maksimal 5 MB.' }],
      'Ukuran gambar terlalu besar.',
    );
  }

  const kind = detectImageKind(buffer);
  if (!kind) {
    throw new ValidationError(
      [{ field: 'image', message: 'Format gambar harus JPG, PNG, WEBP, atau GIF.' }],
      'Format gambar tidak didukung.',
    );
  }

  await mkdir(uploadsDir, { recursive: true });

  // Nama file acak: tidak memakai nama dari client (rawan path traversal dan tabrakan).
  const filename = `${Date.now()}-${randomUUID()}.${kind.ext}`;
  await writeFile(path.join(uploadsDir, filename), buffer);

  return `${UPLOAD_URL_PREFIX}/${filename}`;
}
