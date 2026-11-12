-- ============================================================================
-- 02-seed-images.sql
-- Mengisi image_url untuk SELURUH 13 warung dan 25 menu yang ada.
--
-- Sumber gambar: Unsplash (dihotlink, tidak ada file biner di repo).
-- Semua URL sudah diverifikasi mengembalikan HTTP 200.
-- Format: https://images.unsplash.com/photo-<id>?auto=format&fit=crop&w=<lebar>&q=70
--
-- Sifat: IDEMPOTEN (UPDATE berdasarkan id) dan tidak menimpa data lain.
-- Jalankan setelah 01-add-image-columns.sql.
-- ============================================================================

-- ---------------------------------- WARUNG ----------------------------------
UPDATE dbo.STALLS SET image_url = 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=1200&q=70' WHERE id = 1;  -- Warung Bu Tini Spesial (Kwetiau & Mie)
UPDATE dbo.STALLS SET image_url = 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=1200&q=70' WHERE id = 2;  -- Dapur Bu Inah (Nasi)
UPDATE dbo.STALLS SET image_url = 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=70' WHERE id = 3;  -- Kedai Pak Slamet (Bakso)
UPDATE dbo.STALLS SET image_url = 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=1200&q=70' WHERE id = 4;  -- Kedai Cak Nur (Mie)
UPDATE dbo.STALLS SET image_url = 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=70' WHERE id = 5;  -- Warung Makmur (Minuman)
UPDATE dbo.STALLS SET image_url = 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=1200&q=70' WHERE id = 6;  -- Kedai Segar (Minuman)
UPDATE dbo.STALLS SET image_url = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=70' WHERE id = 7;  -- Dapur Mas Bayu (Western)
UPDATE dbo.STALLS SET image_url = 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=1200&q=70' WHERE id = 8;  -- Warung Mas Andre (Sate)
UPDATE dbo.STALLS SET image_url = 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=70' WHERE id = 10; -- Dapur Pak Hasan (Nasi)
UPDATE dbo.STALLS SET image_url = 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=1200&q=70' WHERE id = 12; -- Warung Bakmi Bu Tini (Bakmi)
UPDATE dbo.STALLS SET image_url = 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=1200&q=70' WHERE id = 13; -- Warung Pak Memek (Nasi Goreng)
UPDATE dbo.STALLS SET image_url = 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?auto=format&fit=crop&w=1200&q=70' WHERE id = 14; -- Warung Pak Memek (Makanan)
UPDATE dbo.STALLS SET image_url = 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1200&q=70' WHERE id = 15; -- Gorengan Bu Tini (Camilan)

-- ----------------------------------- MENU -----------------------------------
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800&q=70' WHERE id = 1;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=800&q=70' WHERE id = 2;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=800&q=70' WHERE id = 3;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=70' WHERE id = 4;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=70' WHERE id = 5;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=70' WHERE id = 6;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=70' WHERE id = 7;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=70' WHERE id = 8;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=70' WHERE id = 9;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=70' WHERE id = 10;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=800&q=70' WHERE id = 11;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=70' WHERE id = 12;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=70' WHERE id = 13;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=70' WHERE id = 14;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=70' WHERE id = 15;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=70' WHERE id = 16;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=70' WHERE id = 19;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=70' WHERE id = 21;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=70' WHERE id = 22;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=70' WHERE id = 23;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=70' WHERE id = 24;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=70' WHERE id = 25;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=800&q=70' WHERE id = 26;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=70' WHERE id = 27;
UPDATE dbo.MENU_ITEMS SET image_url = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=70' WHERE id = 28;
GO

-- -------------------------------- VERIFIKASI --------------------------------
-- Warung terisi harus 13 dan menu terisi harus 25.
SELECT
  (SELECT COUNT(*) FROM dbo.STALLS WHERE image_url IS NOT NULL) AS stall_with_image,
  (SELECT COUNT(*) FROM dbo.STALLS) AS stall_total,
  (SELECT COUNT(*) FROM dbo.MENU_ITEMS WHERE image_url IS NOT NULL) AS menu_with_image,
  (SELECT COUNT(*) FROM dbo.MENU_ITEMS) AS menu_total;
GO

-- Daftar yang masih kosong (harus tidak ada baris).
SELECT 'STALLS' AS tabel, id, name FROM dbo.STALLS WHERE image_url IS NULL
UNION ALL
SELECT 'MENU_ITEMS' AS tabel, id, name FROM dbo.MENU_ITEMS WHERE image_url IS NULL;
GO
