import './setup-env.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canDeleteReview, canManageStall } from '../src/services/ownership.ts';

describe('canManageStall', () => {
  it('owner hanya boleh mengelola warung miliknya', () => {
    assert.equal(canManageStall(2, { id: 2, role: 'owner' }), true);
    assert.equal(canManageStall(3, { id: 2, role: 'owner' }), false);
  });

  it('admin boleh mengelola warung siapa pun, customer tidak', () => {
    assert.equal(canManageStall(3, { id: 1, role: 'admin' }), true);
    assert.equal(canManageStall(3, { id: 4, role: 'customer' }), false);
  });
});

describe('canDeleteReview', () => {
  it('penulis dan admin boleh, orang lain tidak', () => {
    assert.equal(canDeleteReview(5, { id: 5, role: 'customer' }), true);
    assert.equal(canDeleteReview(5, { id: 1, role: 'admin' }), true);
    assert.equal(canDeleteReview(5, { id: 6, role: 'customer' }), false);
  });
});
