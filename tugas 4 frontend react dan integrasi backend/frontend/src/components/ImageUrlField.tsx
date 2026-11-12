import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { ImagePlus, Link2, Upload, X } from 'lucide-react'
import { uploadImage } from '../lib/api.ts'
import { describeError } from '../lib/errors.ts'
import { Button, Field, Spinner, inputClass } from './ui.tsx'
import { EntityImage } from './EntityImage.tsx'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024

interface Props {
  id: string
  label: string
  hint?: string
  /** Error validasi dari form (mis. URL bukan http/https). */
  error?: string
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}

/**
 * Input gambar dengan dua cara: tempel URL atau unggah file dari perangkat
 * (termasuk seret & lepas). File diunggah ke `POST /uploads`, lalu URL hasil
 * unggahan disimpan lewat `onChange` seperti URL biasa — backend tetap
 * menerima `imageUrl` berupa http/https.
 */
export function ImageUrlField({ id, label, hint, error, value, disabled = false, onChange }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const shownError = error ?? uploadError ?? undefined
  const isBusy = disabled || isUploading

  function pickFile(file: File | undefined) {
    if (!file) return

    setUploadError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Format gambar harus JPG, PNG, WEBP, atau GIF.')
      return
    }
    if (file.size > MAX_BYTES) {
      setUploadError('Ukuran gambar maksimal 5 MB.')
      return
    }

    setIsUploading(true)
    void uploadImage(file)
      .then((url) => onChange(url))
      .catch((err: unknown) => {
        const { message, requestId } = describeError(err)
        setUploadError(requestId ? `${message} (kode: ${requestId})` : message)
      })
      .finally(() => {
        setIsUploading(false)
        // Reset agar file yang sama bisa dipilih ulang setelah gagal.
        if (fileInput.current) fileInput.current.value = ''
      })
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    pickFile(event.target.files?.[0])
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (isBusy) return
    pickFile(event.dataTransfer.files?.[0])
  }

  return (
    <Field label={label} htmlFor={`${id}-url`} hint={hint} error={shownError}>
      <div className="grid gap-2">
        <div className="flex items-start gap-2">
          <span className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-3 size-4 text-text-muted" aria-hidden="true" />
            <input
              id={`${id}-url`}
              className={`${inputClass} pl-9`}
              value={value}
              onChange={(event) => {
                setUploadError(null)
                onChange(event.target.value)
              }}
              maxLength={500}
              placeholder="https://images.unsplash.com/photo-..."
              disabled={isBusy}
              aria-invalid={shownError ? true : undefined}
            />
          </span>
          {value ? (
            <Button
              variant="ghost"
              className="h-10 shrink-0 px-3 text-text-muted"
              aria-label="Hapus gambar"
              title="Hapus gambar"
              disabled={isBusy}
              onClick={() => onChange('')}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault()
            if (!isBusy) setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`rounded-control border border-dashed px-4 py-3 text-center transition ${
            isDragging ? 'border-primary bg-surface-muted' : 'border-border bg-surface'
          }`}
        >
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="sr-only"
            onChange={onFileChange}
            disabled={isBusy}
          />
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
            {isUploading ? (
              <span className="inline-flex items-center gap-2 font-semibold text-primary">
                <Spinner /> Mengunggah gambar...
              </span>
            ) : (
              <>
                <Upload className="size-4 text-text-muted" aria-hidden="true" />
                <span className="text-text-muted">Seret &amp; lepas gambar di sini, atau</span>
                <Button variant="secondary" className="h-8" disabled={isBusy} onClick={() => fileInput.current?.click()}>
                  <ImagePlus className="size-4" aria-hidden="true" /> Pilih file
                </Button>
              </>
            )}
          </div>
          <p className="mb-0 mt-1 text-xs text-text-muted">JPG, PNG, WEBP, atau GIF. Maksimal 5 MB.</p>
        </div>

        <EntityImage
          src={value.trim() || null}
          alt="Pratinjau gambar"
          className="aspect-[16/9] w-full rounded-control"
          iconClassName="size-6"
        />
      </div>
    </Field>
  )
}
