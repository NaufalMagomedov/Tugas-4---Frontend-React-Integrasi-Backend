import { useState, type FormEvent } from 'react'
import { createStall, updateStall } from '../lib/api.ts'
import { describeError, getFieldErrors } from '../lib/errors.ts'
import {
  EMPTY_STALL,
  STALL_FIELDS,
  firstErrorField,
  toStallPayload,
  validateStallForm,
  type FormErrors,
  type StallField,
  type StallFormValues,
} from '../lib/validation.ts'
import type { Stall } from '../types/api.ts'
import { Alert, Button, Field, Modal, Spinner, inputClass, textareaClass } from './ui.tsx'
import { ImageUrlField } from './ImageUrlField.tsx'

interface Props {
  /** Diisi = mode ubah; kosong = mode tambah. */
  stall?: Stall
  onClose: () => void
  onSaved: (message: string) => void
}

export function StallFormModal({ stall, onClose, onSaved }: Props) {
  const [values, setValues] = useState<StallFormValues>(
    stall
      ? { name: stall.name, category: stall.category ?? '', location: stall.location ?? '', description: stall.description ?? '', imageUrl: stall.imageUrl ?? '' }
      : EMPTY_STALL,
  )
  const [errors, setErrors] = useState<FormErrors<StallField>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function change(field: StallField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    // Error field hilang begitu pengguna memperbaiki nilainya.
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const found = validateStallForm(values)
    setErrors(found)
    const first = firstErrorField(found, STALL_FIELDS)
    if (first) {
      document.getElementById(`stall-${first}`)?.focus()
      return
    }

    setIsSaving(true)
    try {
      const payload = toStallPayload(values)
      const saved = stall ? await updateStall(stall.id, payload) : await createStall(payload)
      onSaved(saved.message)
    } catch (error) {
      // Validasi backend dipetakan ke field; sisanya tampil sebagai alert umum.
      const fieldErrors = getFieldErrors(error)
      const known = Object.fromEntries(Object.entries(fieldErrors).filter(([key]) => STALL_FIELDS.includes(key as StallField)))
      setErrors(known)

      if (Object.keys(known).length === 0) {
        const { message, requestId } = describeError(error)
        setFormError(requestId ? `${message} (kode: ${requestId})` : message)
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      title={stall ? 'Ubah Warung' : 'Tambah Warung'}
      onClose={isSaving ? () => undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>Batal</Button>
          <Button type="submit" form="stall-form" disabled={isSaving}>
            {isSaving ? <Spinner /> : null}
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </>
      }
    >
      <form id="stall-form" onSubmit={submit} noValidate className="grid gap-4">
        {formError ? <Alert tone="error">{formError}</Alert> : null}
        <Field label="Nama warung" htmlFor="stall-name" error={errors.name}>
          <input id="stall-name" className={inputClass} value={values.name} onChange={(e) => change('name', e.target.value)} maxLength={100} aria-invalid={errors.name ? true : undefined} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kategori" htmlFor="stall-category" hint="Opsional, mis. Nasi atau Minuman." error={errors.category}>
            <input id="stall-category" className={inputClass} value={values.category} onChange={(e) => change('category', e.target.value)} maxLength={50} />
          </Field>
          <Field label="Lokasi" htmlFor="stall-location" hint="Opsional, mis. Kantin FK." error={errors.location}>
            <input id="stall-location" className={inputClass} value={values.location} onChange={(e) => change('location', e.target.value)} maxLength={100} />
          </Field>
        </div>
        <Field label="Deskripsi" htmlFor="stall-description" error={errors.description}>
          <textarea id="stall-description" className={textareaClass} value={values.description} onChange={(e) => change('description', e.target.value)} maxLength={1000} />
        </Field>
        <ImageUrlField
          id="stall-imageUrl"
          label="Foto / cover warung"
          hint="Tempel tautan gambar, atau unggah file dari perangkat. Kosongkan untuk menghapus gambar."
          value={values.imageUrl}
          error={errors.imageUrl}
          disabled={isSaving}
          onChange={(value) => change('imageUrl', value)}
        />
      </form>
    </Modal>
  )
}
