import { useState, type FormEvent } from 'react'
import { createMenu, updateMenu } from '../lib/api.ts'
import { describeError, getFieldErrors } from '../lib/errors.ts'
import {
  EMPTY_MENU,
  MENU_FIELDS,
  firstErrorField,
  toMenuPayload,
  validateMenuForm,
  type FormErrors,
  type MenuField,
  type MenuFormValues,
} from '../lib/validation.ts'
import type { MenuItem } from '../types/api.ts'
import { Alert, Button, Field, Modal, Spinner, inputClass } from './ui.tsx'
import { ImageUrlField } from './ImageUrlField.tsx'

interface Props {
  stallId: number
  /** Diisi = mode ubah; kosong = mode tambah. */
  menu?: MenuItem
  onClose: () => void
  onSaved: (message: string) => void
}

export function MenuFormModal({ stallId, menu, onClose, onSaved }: Props) {
  const [values, setValues] = useState<MenuFormValues>(
    menu ? { name: menu.name, price: String(menu.price), isAvailable: menu.isAvailable, imageUrl: menu.imageUrl ?? '' } : EMPTY_MENU,
  )
  const [errors, setErrors] = useState<FormErrors<MenuField>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function change<K extends keyof MenuFormValues>(field: K, value: MenuFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    if (field === 'name' || field === 'price' || field === 'imageUrl') setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const found = validateMenuForm(values)
    setErrors(found)
    const first = firstErrorField(found, MENU_FIELDS)
    if (first) {
      document.getElementById(`menu-${first}`)?.focus()
      return
    }

    setIsSaving(true)
    try {
      const payload = toMenuPayload(values)
      const saved = menu ? await updateMenu(menu.id, payload) : await createMenu(stallId, payload)
      onSaved(saved.message)
    } catch (error) {
      // Mis. 409 MENU_NAME_TAKEN datang dengan field "name" -> tampil di bawah input nama.
      const fieldErrors = getFieldErrors(error)
      const known = Object.fromEntries(Object.entries(fieldErrors).filter(([key]) => MENU_FIELDS.includes(key as MenuField)))
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
      title={menu ? 'Ubah Menu' : 'Tambah Menu'}
      onClose={isSaving ? () => undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>Batal</Button>
          <Button type="submit" form="menu-form" disabled={isSaving}>
            {isSaving ? <Spinner /> : null}
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </>
      }
    >
      <form id="menu-form" onSubmit={submit} noValidate className="grid gap-4">
        {formError ? <Alert tone="error">{formError}</Alert> : null}
        <Field label="Nama menu" htmlFor="menu-name" error={errors.name}>
          <input id="menu-name" className={inputClass} value={values.name} onChange={(e) => change('name', e.target.value)} maxLength={100} aria-invalid={errors.name ? true : undefined} />
        </Field>
        {/* type="text" + inputMode numeric (bukan type="number") agar "abc", "-1", "1e3" bisa ditolak eksplisit. */}
        <Field label="Harga (Rp)" htmlFor="menu-price" error={errors.price}>
          <input id="menu-price" className={inputClass} inputMode="numeric" value={values.price} onChange={(e) => change('price', e.target.value)} placeholder="5000" aria-invalid={errors.price ? true : undefined} />
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={values.isAvailable} onChange={(e) => change('isAvailable', e.target.checked)} className="size-4 accent-primary" />
          Menu tersedia
        </label>
        <ImageUrlField
          id="menu-imageUrl"
          label="Foto menu"
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
