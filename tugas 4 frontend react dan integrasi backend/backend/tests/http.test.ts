import './setup-env.ts';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import type { Server } from 'node:http';
import { app } from '../src/app.ts';
import { signToken } from '../src/services/tokenService.ts';

/**
 * Pengujian HTTP end-to-end terhadap middleware dan routing TANPA database:
 * semua skenario di sini ditolak SEBELUM menyentuh query (validasi, 401, 403,
 * CORS, 404), sehingga tidak butuh SQL Server.
 */
let server: Server;
let base = '';

const cookieFor = (role: 'admin' | 'owner' | 'customer', id = 7) =>
  `kantin_session_test=${signToken({ id, name: `User ${role}`, email: `${role}@kantin.test`, role })}`;

async function call(path: string, init: RequestInit & { cookie?: string } = {}) {
  const { cookie, headers, ...rest } = init;
  const response = await fetch(`${base}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...headers },
  });
  const text = await response.text();
  return { response, body: text ? (JSON.parse(text) as Record<string, any>) : null };
}

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

describe('kontrak error', () => {
  it('route tidak dikenal -> 404 ROUTE_NOT_FOUND dengan requestId', async () => {
    const { response, body } = await call('/api/v1/tidak-ada');
    assert.equal(response.status, 404);
    assert.equal(body?.code, 'ROUTE_NOT_FOUND');
    assert.equal(body?.requestId, response.headers.get('x-request-id'));
  });

  it('X-Request-Id dari client dipakai ulang', async () => {
    const { response, body } = await call('/api/v1/tidak-ada', { headers: { 'X-Request-Id': 'trace-abc-123' } });
    assert.equal(response.headers.get('x-request-id'), 'trace-abc-123');
    assert.equal(body?.requestId, 'trace-abc-123');
  });

  it('JSON rusak -> 400 INVALID_JSON', async () => {
    const { response, body } = await call('/api/v1/auth/login', { method: 'POST', body: '{"email":' });
    assert.equal(response.status, 400);
    assert.equal(body?.code, 'INVALID_JSON');
  });
});

describe('validasi', () => {
  it('register dengan password lemah -> 400 VALIDATION_ERROR dengan field password', async () => {
    const { response, body } = await call('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bagas', email: 'bagas@student.test', password: 'hanyahuruf' }),
    });
    assert.equal(response.status, 400);
    assert.equal(body?.code, 'VALIDATION_ERROR');
    assert.deepEqual(body?.errors, [{ field: 'password', message: 'password harus mengandung angka' }]);
  });

  it('register yang mencoba mengirim role -> 400 (field body)', async () => {
    const { response, body } = await call('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bagas', email: 'b@student.test', password: 'rahasia123', role: 'admin' }),
    });
    assert.equal(response.status, 400);
    assert.equal(body?.errors?.[0]?.field, 'body');
  });

  it('id path tidak valid -> 400 pada field id', async () => {
    const { response, body } = await call('/api/v1/stalls/abc');
    assert.equal(response.status, 400);
    assert.equal(body?.errors?.[0]?.field, 'id');
  });

  it('query page=0 -> 400', async () => {
    const { response } = await call('/api/v1/stalls?page=0');
    assert.equal(response.status, 400);
  });
});

describe('autentikasi (401) dan otorisasi (403)', () => {
  it('tanpa cookie -> 401 UNAUTHORIZED, bahkan sebelum body divalidasi', async () => {
    const { response, body } = await call('/api/v1/stalls', { method: 'POST', body: JSON.stringify({}) });
    assert.equal(response.status, 401);
    assert.equal(body?.code, 'UNAUTHORIZED');
  });

  it('cookie dengan token palsu -> 401', async () => {
    const { response } = await call('/api/v1/auth/me', { cookie: 'kantin_session_test=bukan.token.valid' });
    assert.equal(response.status, 401);
  });

  it('header Authorization Bearer tidak lagi dipakai sebagai sesi', async () => {
    const token = cookieFor('admin').split('=')[1];
    const { response } = await call('/api/v1/admin/reports', { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(response.status, 401);
  });

  it('customer membuat warung -> 403 FORBIDDEN', async () => {
    const { response, body } = await call('/api/v1/stalls', { method: 'POST', cookie: cookieFor('customer'), body: JSON.stringify({ name: 'Warung X' }) });
    assert.equal(response.status, 403);
    assert.equal(body?.code, 'FORBIDDEN');
  });

  it('customer menghapus warung -> 403 (hanya owner/admin yang lolos middleware)', async () => {
    const { response } = await call('/api/v1/stalls/1', { method: 'DELETE', cookie: cookieFor('customer') });
    assert.equal(response.status, 403);
  });

  it('customer membuka /admin/reports dan /stalls/mine -> 403', async () => {
    assert.equal((await call('/api/v1/admin/reports', { cookie: cookieFor('customer') })).response.status, 403);
    assert.equal((await call('/api/v1/stalls/mine', { cookie: cookieFor('customer') })).response.status, 403);
  });

  it('customer menambah/mengubah/menghapus menu -> 403 sebelum menyentuh database', async () => {
    const cookie = cookieFor('customer');
    const body = JSON.stringify({ name: 'Es Teh', price: 3000 });
    assert.equal((await call('/api/v1/stalls/1/menus', { method: 'POST', cookie, body })).response.status, 403);
    assert.equal((await call('/api/v1/menus/1', { method: 'PUT', cookie, body })).response.status, 403);
    assert.equal((await call('/api/v1/menus/1', { method: 'DELETE', cookie })).response.status, 403);
  });

  it('owner dengan body menu tidak valid -> 400 (role lolos, validasi menolak)', async () => {
    const { response, body } = await call('/api/v1/stalls/1/menus', {
      method: 'POST',
      cookie: cookieFor('owner'),
      body: JSON.stringify({ name: 'Es Teh', price: '3000' }),
    });
    assert.equal(response.status, 400);
    assert.equal(body?.errors?.[0]?.field, 'price');
  });
});

describe('sesi, CORS, dan origin guard', () => {
  it('logout menghapus cookie sesi', async () => {
    const { response, body } = await call('/api/v1/auth/logout', { method: 'POST' });
    assert.equal(response.status, 200);
    assert.equal(body?.data?.loggedOut, true);
    const setCookie = response.headers.get('set-cookie') ?? '';
    assert.match(setCookie, /kantin_session_test=;/);
    assert.match(setCookie, /HttpOnly/i);
  });

  it('preflight OPTIONS dijawab 204 dengan origin spesifik dan credentials', async () => {
    const response = await fetch(`${base}/api/v1/stalls`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173' } });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
  });

  it('request mutasi dari origin asing -> 403 ORIGIN_FORBIDDEN', async () => {
    const { response, body } = await call('/api/v1/auth/logout', { method: 'POST', headers: { Origin: 'http://evil.example' } });
    assert.equal(response.status, 403);
    assert.equal(body?.code, 'ORIGIN_FORBIDDEN');
  });

  it('request mutasi dari origin frontend yang sah lolos', async () => {
    const { response } = await call('/api/v1/auth/logout', { method: 'POST', headers: { Origin: 'http://localhost:5173' } });
    assert.equal(response.status, 200);
  });
});

describe('dokumentasi', () => {
  it('swagger.json memuat cookieAuth dan seluruh endpoint baru', async () => {
    const { response, body } = await call('/docs/swagger.json');
    assert.equal(response.status, 200);
    assert.ok(body?.components?.securitySchemes?.cookieAuth);
    for (const path of ['/api/v1/stalls/{id}/menus', '/api/v1/menus/{id}', '/api/v1/reviews/{id}', '/api/v1/auth/logout', '/api/v1/stalls/mine']) {
      assert.ok(body?.paths?.[path], `path ${path} hilang dari OpenAPI`);
    }
  });
});
