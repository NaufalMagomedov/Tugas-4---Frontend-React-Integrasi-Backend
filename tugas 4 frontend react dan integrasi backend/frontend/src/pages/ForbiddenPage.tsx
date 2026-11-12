import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui.tsx'
import { buttonClass } from '../lib/buttonClass.ts'

export function ForbiddenPage() {
  return (
    <EmptyState
      icon={ShieldAlert}
      title="Akses ditolak"
      message="Akun Anda tidak memiliki izin untuk membuka halaman ini."
      action={<Link to="/" className={buttonClass('primary')}>Kembali ke beranda</Link>}
    />
  )
}
