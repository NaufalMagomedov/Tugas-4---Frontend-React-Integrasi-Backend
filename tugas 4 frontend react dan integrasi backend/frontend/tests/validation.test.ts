import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  firstErrorField,
  passwordChecks,
  toMenuPayload,
  toReviewPayload,
  toStallPayload,
  validateLoginForm,
  validateMenuForm,
  validateRegisterForm,
  validateReviewForm,
  validateStallForm,
} from '../src/lib/validation.ts'

describe('validateLoginForm', () => {
  it('menolak kosong dan format email salah', () => {
    assert.deepEqual(validateLoginForm({ email: '', password: '' }), {
      email: 'Email wajib diisi.',
      password: 'Password wajib diisi.',
    })
    assert.equal(validateLoginForm({ email: 'bukan-email', password: 'x' }).email, 'Format email tidak valid.')
  })

  it('tidak memaksa panjang password saat login', () => {
    assert.deepEqual(validateLoginForm({ email: 'a@b.co', password: 'x' }), {})
  })
})

describe('validateRegisterForm', () => {
  const valid = { name: 'Bagas', email: 'bagas@student.test', password: 'rahasia123', confirmPassword: 'rahasia123' }

  it('menerima data valid', () => assert.deepEqual(validateRegisterForm(valid), {}))

  it('menolak password tanpa huruf/angka sama seperti backend', () => {
    assert.equal(validateRegisterForm({ ...valid, password: 'hanyahuruf', confirmPassword: 'hanyahuruf' }).password, 'Password harus mengandung angka.')
    assert.equal(validateRegisterForm({ ...valid, password: '12345678', confirmPassword: '12345678' }).password, 'Password harus mengandung huruf.')
  })

  it('menolak konfirmasi yang tidak sama dan nama pendek', () => {
    assert.equal(validateRegisterForm({ ...valid, confirmPassword: 'beda12345' }).confirmPassword, 'Konfirmasi password tidak sama.')
    assert.equal(validateRegisterForm({ ...valid, name: 'Ab' }).name, 'Nama minimal 3 karakter.')
  })

  it('passwordChecks menandai syarat yang terpenuhi', () => {
    const checks = passwordChecks('abc12345')
    assert.ok(checks.every((check) => check.valid))
    assert.equal(passwordChecks('abc').filter((check) => check.valid).length, 2) // maks + huruf
  })
})

describe('validateStallForm', () => {
  it('nama wajib dan minimal 3 karakter', () => {
    assert.equal(validateStallForm({ name: '', category: '', location: '', description: '', imageUrl: '' }).name, 'Nama warung wajib diisi.')
    assert.equal(validateStallForm({ name: 'ab', category: '', location: '', description: '', imageUrl: '' }).name, 'Nama warung minimal 3 karakter.')
  })

  it('field opsional kosong dikirim sebagai null', () => {
    assert.deepEqual(toStallPayload({ name: ' Warung Baru ', category: ' ', location: 'Kantin', description: '', imageUrl: '' }), {
      name: 'Warung Baru',
      category: null,
      location: 'Kantin',
      description: null,
      imageUrl: null,
    })
  })

  it('menerima URL gambar http/https dan menolak protokol lain', () => {
    const base = { name: 'Warung Baru', category: '', location: '', description: '' }
    const url = 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800'
    assert.deepEqual(validateStallForm({ ...base, imageUrl: url }), {})
    assert.deepEqual(validateStallForm({ ...base, imageUrl: '   ' }), {})
    for (const imageUrl of ['javascript:alert(1)', 'data:image/png;base64,AAAA', 'ftp://contoh.test/a.jpg', 'bukan url']) {
      assert.match(validateStallForm({ ...base, imageUrl }).imageUrl ?? '', /http:\/\/ atau https:\/\//, imageUrl)
    }
    assert.match(validateStallForm({ ...base, imageUrl: `https://contoh.test/${'a'.repeat(500)}` }).imageUrl ?? '', /maksimal 500/)
  })
})

describe('validateMenuForm', () => {
  it('menolak harga kosong, nol, dan bukan angka bulat', () => {
    const price = (value: string) => validateMenuForm({ name: 'Es Teh', price: value, isAvailable: true, imageUrl: '' }).price
    assert.equal(price(''), 'Harga wajib diisi.')
    assert.equal(price('0'), 'Harga harus lebih dari 0.')
    for (const bad of ['abc', '-1000', '1.5', '1e3', '5.000']) assert.match(price(bad) ?? '', /angka bulat/, bad)
    assert.match(price('1000001') ?? '', /maksimal/)
    assert.equal(price('5000'), undefined)
  })

  it('payload harga bertipe number', () => {
    assert.deepEqual(toMenuPayload({ name: ' Es Teh ', price: ' 5000 ', isAvailable: false, imageUrl: '' }), {
      name: 'Es Teh',
      price: 5000,
      isAvailable: false,
      imageUrl: null,
    })
  })

  it('payload gambar terisi dikirim apa adanya, URL salah ditolak', () => {
    const url = 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800'
    assert.equal(toMenuPayload({ name: 'Es Teh', price: '5000', isAvailable: true, imageUrl: ` ${url} ` }).imageUrl, url)
    assert.match(
      validateMenuForm({ name: 'Es Teh', price: '5000', isAvailable: true, imageUrl: 'javascript:alert(1)' }).imageUrl ?? '',
      /http:\/\/ atau https:\/\//,
    )
  })

  it('firstErrorField mengikuti urutan form', () => {
    const errors = validateMenuForm({ name: '', price: '', isAvailable: true, imageUrl: '' })
    assert.equal(firstErrorField(errors, ['name', 'price']), 'name')
    assert.equal(firstErrorField({}, ['name', 'price']), null)
  })
})

describe('validateReviewForm', () => {
  it('rating wajib 1-5', () => {
    assert.equal(validateReviewForm({ rating: 0, comment: '' }).rating, 'Pilih rating 1 sampai 5 bintang.')
    assert.deepEqual(validateReviewForm({ rating: 5, comment: '' }), {})
  })

  it('komentar kosong menjadi null', () => {
    assert.deepEqual(toReviewPayload({ rating: 4, comment: '   ' }), { rating: 4, comment: null })
  })
})
