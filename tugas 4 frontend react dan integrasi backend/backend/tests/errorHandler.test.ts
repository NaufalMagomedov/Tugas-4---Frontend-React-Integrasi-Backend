import './setup-env.ts';
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { ConflictError } from '../src/errors/ConflictError.ts';
import { ForbiddenError } from '../src/errors/ForbiddenError.ts';
import { NotFoundError } from '../src/errors/NotFoundError.ts';
import { ValidationError } from '../src/errors/ValidationError.ts';
import { errorHandler } from '../src/middlewares/errorHandler.ts';

function run(error: unknown) {
  let statusCode = 0;
  let body: Record<string, unknown> = {};
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: Record<string, unknown>) {
      body = payload;
      return this;
    },
  } as unknown as Response;

  errorHandler(error, { requestId: 'req-123' } as Request, res, () => undefined);
  return { statusCode, body };
}

describe('errorHandler', () => {
  beforeEach(() => mock.method(console, 'error', () => undefined));
  afterEach(() => mock.restoreAll());

  it('selalu menyertakan requestId dan code', () => {
    const { statusCode, body } = run(new NotFoundError('Warung tidak ditemukan.', 'STALL_NOT_FOUND'));
    assert.equal(statusCode, 404);
    assert.deepEqual(body, { status: 'fail', code: 'STALL_NOT_FOUND', message: 'Warung tidak ditemukan.', requestId: 'req-123' });
  });

  it('ValidationError -> 400 dengan errors[] per field', () => {
    const { statusCode, body } = run(new ValidationError([{ field: 'price', message: 'price harus lebih dari 0' }]));
    assert.equal(statusCode, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
    assert.deepEqual(body.errors, [{ field: 'price', message: 'price harus lebih dari 0' }]);
  });

  it('ForbiddenError dan ConflictError membawa code spesifik', () => {
    assert.equal(run(new ForbiddenError('x', 'STALL_FORBIDDEN')).body.code, 'STALL_FORBIDDEN');
    const conflict = run(new ConflictError('x', 'MENU_NAME_TAKEN'));
    assert.equal(conflict.statusCode, 409);
    assert.equal(conflict.body.code, 'MENU_NAME_TAKEN');
  });

  it('JSON rusak -> 400 INVALID_JSON', () => {
    const parseError = Object.assign(new SyntaxError('Unexpected token'), { status: 400, type: 'entity.parse.failed' });
    const { statusCode, body } = run(parseError);
    assert.equal(statusCode, 400);
    assert.equal(body.code, 'INVALID_JSON');
  });

  it('body terlalu besar -> 413 PAYLOAD_TOO_LARGE', () => {
    const { statusCode, body } = run(Object.assign(new Error('too large'), { type: 'entity.too.large' }));
    assert.equal(statusCode, 413);
    assert.equal(body.code, 'PAYLOAD_TOO_LARGE');
  });

  it('ZodError yang lolos tanpa middleware tetap menjadi 400', () => {
    const zodError = z.object({ a: z.string() }).safeParse({}).error;
    const { statusCode, body } = run(zodError);
    assert.equal(statusCode, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
  });

  it('unique violation (2627) langsung maupun terbungkus cause Drizzle -> 409', () => {
    assert.equal(run({ number: 2627 }).statusCode, 409);
    const wrapped = Object.assign(new Error('Failed query'), { cause: { originalError: { number: 2601 } } });
    assert.equal(run(wrapped).statusCode, 409);
  });

  it('foreign key violation (547) -> 409 CONFLICT', () => {
    const { statusCode, body } = run(Object.assign(new Error('Failed query'), { cause: { number: 547 } }));
    assert.equal(statusCode, 409);
    assert.equal(body.code, 'CONFLICT');
  });

  it('error tak terduga -> 500 generik tanpa membocorkan detail', () => {
    const { statusCode, body } = run(new Error('Login failed for user sa at 10.0.0.5'));
    assert.equal(statusCode, 500);
    assert.equal(body.status, 'error');
    assert.equal(body.code, 'INTERNAL_ERROR');
    assert.ok(!JSON.stringify(body).includes('10.0.0.5'));
  });
});
