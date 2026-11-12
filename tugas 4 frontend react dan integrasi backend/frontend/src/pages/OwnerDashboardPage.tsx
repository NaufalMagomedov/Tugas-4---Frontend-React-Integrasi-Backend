import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Pencil, Plus, Store, Trash2 } from 'lucide-react'
import { StallFormModal } from '../components/StallFormModal.tsx'
import { StallMenuManager } from '../components/StallMenuManager.tsx'
import { EntityImage } from '../components/EntityImage.tsx'
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorPanel, LoadingPanel, PageHeader } from '../components/ui.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { useApiData } from '../hooks/useApiData.ts'
import { deleteStall, getMyStalls } from '../lib/api.ts'
import { describeError } from '../lib/errors.ts'
import { formatRating } from '../lib/format.ts'
import type { Stall } from '../types/api.ts'

type Dialog =
  | { type: 'stall'; stall?: Stall }
  | { type: 'delete-stall'; stall: Stall }

export function OwnerDashboardPage() {
  const { showToast } = useToast()
  const { data, error, reload } = useApiData(getMyStalls, [])
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function saved(message: string) {
    setDialog(null)
    showToast({ tone: 'success', message })
    reload()
  }

  async function confirmDeleteStall(stall: Stall) {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const result = await deleteStall(stall.id)
      setDialog(null)
      showToast({ tone: 'success', message: result.message })
      reload()
    } catch (err) {
      // Mis. 409 STALL_HAS_RELATIONS: warung masih punya menu/review.
      const { message, requestId } = describeError(err)
      setDeleteError(requestId ? `${message} (kode: ${requestId})` : message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Pemilik warung"
        title="Dashboard Warung"
        description="Kelola warung dan menu milikmu."
        actions={
          <Button onClick={() => setDialog({ type: 'stall' })}>
            <Plus className="size-4" aria-hidden="true" /> Tambah warung
          </Button>
        }
      />

      {error ? (
        <ErrorPanel error={error} onRetry={reload} />
      ) : !data ? (
        <LoadingPanel message="Memuat warung Anda..." />
      ) : data.length === 0 ? (
        <EmptyState icon={Store} title="Belum ada warung" message="Tambahkan warung pertamamu untuk mulai mengelola menu." />
      ) : (
        <div className="grid gap-6">
          {data.map((stall) => (
            <Card key={stall.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="relative shrink-0">
                    <EntityImage
                      src={stall.imageUrl}
                      alt={`Foto ${stall.name}`}
                      className="size-16 rounded-control"
                    />
                    <button
                      type="button"
                      onClick={() => setDialog({ type: 'stall', stall })}
                      aria-label={`Ubah cover ${stall.name}`}
                      title="Ubah cover warung"
                      className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border border-border bg-surface text-primary shadow-card hover:bg-surface-muted"
                    >
                      <Camera className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {stall.category ? <Badge tone="primary">{stall.category}</Badge> : null}
                      <span className="text-xs font-semibold text-text-muted">
                        ★ {formatRating(stall.avgRating)} &middot; {stall.reviewCount} review
                      </span>
                    </div>
                    <h2 className="mb-0.5 text-xl font-bold">{stall.name}</h2>
                    <p className="mb-0 text-sm text-text-muted">{stall.location || 'Lokasi belum diisi'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/stalls/${stall.id}`} className="inline-flex h-9 items-center rounded-control border border-border px-3 text-sm font-semibold hover:bg-surface-muted">Lihat halaman</Link>
                  <Button variant="secondary" className="h-9" onClick={() => setDialog({ type: 'stall', stall })}>
                    <Pencil className="size-4" aria-hidden="true" /> Ubah
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-9 text-danger"
                    aria-label={`Hapus warung ${stall.name}`}
                    onClick={() => { setDeleteError(null); setDialog({ type: 'delete-stall', stall }) }}
                  >
                    <Trash2 className="size-4" aria-hidden="true" /> Hapus
                  </Button>
                </div>
              </div>

              <div className="mt-5">
                <StallMenuManager stallId={stall.id} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {dialog?.type === 'stall' ? <StallFormModal stall={dialog.stall} onClose={() => setDialog(null)} onSaved={saved} /> : null}
      {dialog?.type === 'delete-stall' ? (
        <ConfirmDialog
          title="Hapus warung?"
          message={`Warung "${dialog.stall.name}" akan dihapus permanen. Warung yang masih punya menu atau review akan ditolak server.`}
          error={deleteError}
          isBusy={isDeleting}
          onClose={() => setDialog(null)}
          onConfirm={() => void confirmDeleteStall(dialog.stall)}
        />
      ) : null}
    </>
  )
}
