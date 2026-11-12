import type { Request, Response } from 'express';
import { saveUploadedImage } from '../utils/uploadStorage.ts';

/**
 * Endpoint unggah gambar (cover warung / foto menu).
 *
 * Body berupa biner mentah (bukan multipart) supaya tidak perlu dependensi
 * tambahan seperti multer. Frontend mengirim `File` langsung dengan header
 * `Content-Type: image/*`; jenis asli file tetap diverifikasi lewat magic bytes.
 * URL absolut dibentuk dari host request agar gambar bisa langsung dipakai
 * sebagai `src` (backend dan frontend berjalan di port berbeda).
 */
export class UploadController {
  uploadImage = async (req: Request, res: Response): Promise<void> => {
    const relativeUrl = await saveUploadedImage(req.body as Buffer);
    const baseUrl = `${req.protocol}://${req.get('host') ?? 'localhost'}`;

    res.status(201).json({
      status: 'success',
      message: 'Gambar berhasil diunggah.',
      data: { url: `${baseUrl}${relativeUrl}` },
    });
  };
}
