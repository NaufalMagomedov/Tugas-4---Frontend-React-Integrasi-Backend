-- ============================================================================
-- 01-add-image-columns.sql
-- Menambah kolom gambar (URL) pada STALLS dan MENU_ITEMS.
--
-- Sifat: ADITIF + IDEMPOTEN.
--   * Hanya menambah kolom baru; kolom/tabel lain tidak disentuh.
--   * Aman dijalankan berulang kali (dicek lewat COL_LENGTH).
--   * Database review_kantin dipakai bersama praktikum lain, jadi jangan
--     mengubah kolom yang sudah ada (mis. MENU_ITEMS.category/description).
--
-- Jalankan sebelum 02-seed-images.sql.
-- ============================================================================

IF COL_LENGTH('dbo.STALLS', 'image_url') IS NULL
BEGIN
  ALTER TABLE dbo.STALLS ADD image_url NVARCHAR(500) NULL;
  PRINT 'Kolom STALLS.image_url ditambahkan.';
END
ELSE
BEGIN
  PRINT 'Kolom STALLS.image_url sudah ada, dilewati.';
END
GO

IF COL_LENGTH('dbo.MENU_ITEMS', 'image_url') IS NULL
BEGIN
  ALTER TABLE dbo.MENU_ITEMS ADD image_url NVARCHAR(500) NULL;
  PRINT 'Kolom MENU_ITEMS.image_url ditambahkan.';
END
ELSE
BEGIN
  PRINT 'Kolom MENU_ITEMS.image_url sudah ada, dilewati.';
END
GO

-- Verifikasi struktur setelah migrasi.
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE COLUMN_NAME = 'image_url'
  AND TABLE_NAME IN ('STALLS', 'MENU_ITEMS')
ORDER BY TABLE_NAME;
GO
