import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Camera, MapPin, Pencil, Star, UtensilsCrossed } from 'lucide-react'
import { StallFormModal } from '../components/StallFormModal.tsx'
import { StallMenuManager } from '../components/StallMenuManager.tsx'
import { EntityImage } from '../components/EntityImage.tsx'
import { Badge, Button, Card, EmptyState, ErrorPanel, LoadingPanel, PageHeader } from '../components/ui.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { useApiData } from '../hooks/useApiData.ts'
import { getStall } from '../lib/api.ts'
import { formatRating } from '../lib/format.ts'

/**
 * Halaman kelola warung untuk admin: ubah data/foto warung dan kelola menu
 * (termasuk foto menu) milik warung siapa pun. Backend sudah mengizinkan
 * admin lewat `canManageStall`, halaman ini hanya menyediakan UI-nya.
 */
export function AdminStallPage() {
  const params = useParams()
  const stallId = Number(params.id)
  const { showToast } = useToast()
  const { data: stall, error, reload } = useApiData(() => getStall(stallId), [stallId])
  const [isEditing, setIsEditing] = useState(false)

  if (!Number.isInteger(stallId) || stallId <= 0) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title="Alamat tidak valid"
        message="ID warung pada alamat harus berupa angka."
        action={<Link to="/admin" className="text-sm font-bold text-primary">Kembali ke Panel Admin</Link>}
      />
    )
  }

  if (error) {
    const notFound = error.code === 'STALL_NOT_FOUND'
    return (
      <>
        <BackLink />
        <ErrorPanel
          error={error}
          onRetry={notFound ? undefined : reload}
          title={notFound ? 'Warung tidak ditemukan' : undefined}
        />
      </>
    )
  }

  if (!stall) {
    return (
      <>
        <BackLink />
        <LoadingPanel message="Memuat warung..." />
      </>
    )
  }

  function saved(message: string) {
    setIsEditing(false)
    showToast({ tone: 'success', message })
    reload()
  }

  return (
    <>
      <BackLink />
      <PageHeader
        eyebrow="Kelola warung"
        title={stall.name}
        description="Ubah cover warung dan kelola menu, termasuk foto tiap menu."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/stalls/${stall.id}`}
              className="inline-flex h-10 items-center rounded-control border border-border px-3 text-sm font-semibold hover:bg-surface-muted"
            >
              Lihat halaman
            </Link>
            <Button onClick={() => setIsEditing(true)}>
              <Pencil className="size-4" aria-hidden="true" /> Ubah warung
            </Button>
          </div>
        }
      />

      <Card className="mb-6 p-6">
        <div className="relative mb-5">
          <EntityImage
            src={stall.imageUrl}
            alt={`Foto ${stall.name}`}
            className="aspect-[21/9] w-full rounded-control"
            iconClassName="size-8"
          />
          <Button
            variant="secondary"
            className="absolute bottom-3 right-3 bg-surface/95 shadow-card"
            onClick={() => setIsEditing(true)}
          >
            <Camera className="size-4" aria-hidden="true" /> {stall.imageUrl ? 'Ganti cover' : 'Tambah cover'}
          </Button>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              {stall.category ? <Badge tone="primary">{stall.category}</Badge> : null}
              {stall.isPopular ? <Badge tone="warning">Populer</Badge> : null}
            </div>
            <p className="mb-0 inline-flex items-center gap-1 text-sm text-text-muted">
              <MapPin className="size-4" aria-hidden="true" /> {stall.location || 'Lokasi belum diisi'}
            </p>
            {stall.description ? (
              <p className="mb-0 mt-3 max-w-3xl text-sm leading-relaxed text-text-muted">{stall.description}</p>
            ) : null}
          </div>
          <div className="rounded-control bg-surface-muted px-4 py-3 text-center">
            <span className="inline-flex items-center gap-1 text-2xl font-extrabold text-warning">
              <Star className="size-6 fill-warning" aria-hidden="true" /> {formatRating(stall.avgRating)}
            </span>
            <p className="mb-0 text-xs font-semibold text-text-muted">{stall.reviewCount} review</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <StallMenuManager stallId={stall.id} onChanged={reload} />
      </Card>

      {isEditing ? (
        <StallFormModal stall={stall} onClose={() => setIsEditing(false)} onSaved={saved} />
      ) : null}
    </>
  )
}

function BackLink() {
  return (
    <Link to="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-dark">
      <ArrowLeft className="size-4" aria-hidden="true" /> Panel Admin
    </Link>
  )
}
