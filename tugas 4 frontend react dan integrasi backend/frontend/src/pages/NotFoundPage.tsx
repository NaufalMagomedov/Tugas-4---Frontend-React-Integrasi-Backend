import { SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui.tsx'
import { buttonClass } from '../lib/buttonClass.ts'

export function NotFoundPage() {
  return (
    <EmptyState
      icon={SearchX}
      title="Halaman tidak ditemukan"
      message="Alamat yang Anda buka tidak ada."
      action={<Link to="/" className={buttonClass('primary')}>Kembali ke beranda</Link>}
    />
  )
}
