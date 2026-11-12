import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Menambahkan method `.openapi()` ke semua type zod. Dipanggil SEKALI di sini;
// seluruh schema mengimpor `z` dari file ini, sehingga urutan import antar
// file schema tidak lagi menentukan apakah `.openapi()` sudah tersedia.
extendZodWithOpenApi(z);

export { z };
