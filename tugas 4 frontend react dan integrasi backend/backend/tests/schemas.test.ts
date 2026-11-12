import './setup-env.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loginSchema, registerSchema } from '../src/schemas/authSchema.ts';
import { createMenuSchema, updateMenuSchema } from '../src/schemas/menuSchema.ts';
import { createReviewSchema } from '../src/schemas/reviewSchema.ts';
import { createStallSchema, idParamSchema, stallQuerySchema, updateStallSchema } from '../src/schemas/stallSchema.ts';

const messagesOf = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('registerSchema', () => {
  const valid = { name: 'Bagas Pratama', email: ' Bagas@Student.Test ', password: 'rahasia123' };

  it('menerima data valid dan menormalkan email', () => {
    const result = registerSchema.safeParse(valid);
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data.email, 'bagas@student.test');
  });

  it('menolak password tanpa angka atau tanpa huruf', () => {
    assert.ok(messagesOf(registerSchema.safeParse({ ...valid, password: 'hanyahuruf' })).includes('password harus mengandung angka'));
    assert.ok(messagesOf(registerSchema.safeParse({ ...valid, password: '12345678' })).includes('password harus mengandung huruf'));
  });

  it('menolak password terlalu pendek dan terlalu panjang', () => {
    assert.equal(registerSchema.safeParse({ ...valid, password: 'abc123' }).success, false);
    assert.equal(registerSchema.safeParse({ ...valid, password: `a1${'x'.repeat(71)}` }).success, false);
  });

  it('menolak field asing seperti role dan confirmPassword (anti mass-assignment)', () => {
    assert.equal(registerSchema.safeParse({ ...valid, role: 'admin' }).success, false);
    assert.equal(registerSchema.safeParse({ ...valid, confirmPassword: 'rahasia123' }).success, false);
  });

  it('menolak email tidak valid dan nama terlalu pendek', () => {
    assert.equal(registerSchema.safeParse({ ...valid, email: 'bukan-email' }).success, false);
    assert.equal(registerSchema.safeParse({ ...valid, name: 'Ab' }).success, false);
  });
});

describe('loginSchema', () => {
  it('hanya mensyaratkan password tidak kosong', () => {
    assert.equal(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success, true);
    assert.equal(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success, false);
  });

  it('menolak field asing', () => {
    assert.equal(loginSchema.safeParse({ email: 'a@b.co', password: 'x', role: 'admin' }).success, false);
  });
});

describe('stall schemas', () => {
  it('createStallSchema tidak menerima ownerId dari client', () => {
    assert.equal(createStallSchema.safeParse({ name: 'Warung Baru', ownerId: 99 }).success, false);
    assert.equal(createStallSchema.safeParse({ name: 'Warung Baru', category: 'Nasi' }).success, true);
  });

  it('updateStallSchema menolak body kosong agar tidak berakhir 500 di query UPDATE', () => {
    assert.equal(updateStallSchema.safeParse({}).success, false);
    assert.equal(updateStallSchema.safeParse({ location: 'Kantin FK' }).success, true);
  });

  it('idParamSchema mengubah string menjadi angka dan menolak id tak valid', () => {
    const ok = idParamSchema.safeParse({ id: '7' });
    assert.equal(ok.success && ok.data.id, 7);
    for (const id of ['abc', '0', '-3', '1.5']) assert.equal(idParamSchema.safeParse({ id }).success, false, id);
  });

  it('stallQuerySchema memberi default page=1 dan limit=10, serta membatasi limit', () => {
    const parsed = stallQuerySchema.parse({});
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 10);
    assert.equal(stallQuerySchema.safeParse({ limit: '101' }).success, false);
    assert.equal(stallQuerySchema.safeParse({ page: '0' }).success, false);
  });

  it('menerima imageUrl http/https, null, dan string kosong', () => {
    const url = 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800';
    assert.equal(createStallSchema.safeParse({ name: 'Warung Baru', imageUrl: url }).success, true);
    assert.equal(createStallSchema.safeParse({ name: 'Warung Baru', imageUrl: null }).success, true);
    assert.equal(createStallSchema.safeParse({ name: 'Warung Baru', imageUrl: '   ' }).success, true);
    assert.equal(createStallSchema.safeParse({ name: 'Warung Baru' }).success, true);
    assert.equal(updateStallSchema.safeParse({ imageUrl: url }).success, true);
  });

  it('menolak imageUrl bukan http/https, terlalu panjang, atau bukan teks', () => {
    for (const imageUrl of ['javascript:alert(1)', 'data:image/png;base64,AAAA', 'ftp://contoh.test/a.jpg', 'bukan url']) {
      assert.equal(createStallSchema.safeParse({ name: 'Warung Baru', imageUrl }).success, false, imageUrl);
    }
    const tooLong = `https://contoh.test/${'a'.repeat(500)}`;
    assert.equal(createStallSchema.safeParse({ name: 'Warung Baru', imageUrl: tooLong }).success, false);
    assert.equal(createStallSchema.safeParse({ name: 'Warung Baru', imageUrl: 123 }).success, false);
  });
});

describe('menu schemas', () => {
  const valid = { name: 'Es Jeruk', price: 5000 };

  it('createMenuSchema memberi default isAvailable=true', () => {
    const result = createMenuSchema.parse(valid);
    assert.equal(result.isAvailable, true);
  });

  it('menolak price bertipe string (tidak ada coerce)', () => {
    assert.equal(createMenuSchema.safeParse({ ...valid, price: '5000' }).success, false);
  });

  it('menolak harga 0, negatif, desimal, dan di atas batas', () => {
    for (const price of [0, -1, 1.5, 1_000_001]) {
      assert.equal(createMenuSchema.safeParse({ ...valid, price }).success, false, String(price));
    }
  });

  it('menolak nama hanya spasi dan field asing', () => {
    assert.equal(createMenuSchema.safeParse({ ...valid, name: '   ' }).success, false);
    assert.equal(createMenuSchema.safeParse({ ...valid, stallId: 1 }).success, false);
  });

  it('updateMenuSchema parsial tetapi tidak boleh kosong', () => {
    assert.equal(updateMenuSchema.safeParse({}).success, false);
    assert.equal(updateMenuSchema.safeParse({ isAvailable: false }).success, true);
  });

  it('menerima imageUrl http/https dan menolak protokol berbahaya', () => {
    const url = 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800';
    assert.equal(createMenuSchema.safeParse({ ...valid, imageUrl: url }).success, true);
    assert.equal(createMenuSchema.safeParse({ ...valid, imageUrl: null }).success, true);
    assert.equal(createMenuSchema.safeParse({ ...valid, imageUrl: 'javascript:alert(1)' }).success, false);
    assert.equal(updateMenuSchema.safeParse({ imageUrl: url }).success, true);
  });
});

describe('createReviewSchema', () => {
  it('menerima rating 1-5 dan menolak di luar rentang', () => {
    assert.equal(createReviewSchema.safeParse({ rating: 5 }).success, true);
    for (const rating of [0, 6, 2.5, 'abc']) assert.equal(createReviewSchema.safeParse({ rating }).success, false, String(rating));
  });

  it('menolak userId dari body', () => {
    assert.equal(createReviewSchema.safeParse({ rating: 4, userId: 1 }).success, false);
  });
});
