import { useState } from 'react'
import { ImageIcon } from 'lucide-react'

interface Props {
  src: string | null | undefined
  alt: string
  /** Ukuran/rounded ditentukan pemanggil, mis. `h-16 w-16 rounded-control`. */
  className?: string
  iconClassName?: string
}

/**
 * Gambar warung/menu dengan fallback yang aman.
 *
 * - URL kosong/null -> kotak placeholder berikon (bukan gambar rusak).
 * - Gambar gagal dimuat (offline/URL salah) -> placeholder yang sama.
 * - `failedSrc` menyimpan URL yang gagal, sehingga mengganti URL di form
 *   otomatis mencoba memuat gambar baru tanpa efek samping state lama.
 */
export function EntityImage({ src, alt, className = '', iconClassName = 'size-5' }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!src || failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`grid place-items-center bg-surface-muted text-text-muted ${className}`}
      >
        <ImageIcon className={iconClassName} aria-hidden="true" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      className={`object-cover ${className}`}
    />
  )
}
