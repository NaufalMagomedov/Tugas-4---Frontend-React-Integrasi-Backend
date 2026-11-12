import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquareText, Pencil, Plus, Star, Store, Trash2, Users } from 'lucide-react'
import { Button, Card, ConfirmDialog, ErrorPanel, LoadingPanel, PageHeader } from '../components/ui.tsx'
import { EntityImage } from '../components/EntityImage.tsx'
import { StallFormModal } from '../components/StallFormModal.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { useApiData } from '../hooks/useApiData.ts'
import { deleteStall, getReport, getStalls } from '../lib/api.ts'
import { describeError } from '../lib/errors.ts'
import { formatRating } from '../lib/format.ts'
import type { Stall } from '../types/api.ts'

export function AdminDashboardPage() {
  const { showToast } = useToast()
  const report = useApiData(getReport, [])
  const stalls = useApiData(() => getStalls({ limit: 100 }), [])

  const [toDelete, setToDelete] = useState<Stall | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  /** Admin membuat warung: pemilik dicatat dari sesi (backend), bukan dari body. */
  function stallCreated(message: string) {
    setIsCreating(false)
    showToast({ tone: 'success', message })
    report.reload()
    stalls.reload()
  }

  async function confirmDelete(stall: Stall) {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const result = await deleteStall(stall.id)
      showToast({ tone: 'success', message: result.message })
      setToDelete(null)
      report.reload()
      stalls.reload()
    } catch (error) {
      // Mis. 409 STALL_HAS_RELATIONS: pesan server yang jelas, bukan error generik.
      const { message, requestId } = describeError(error)
      setDeleteError(requestId ? `${message} (kode: ${requestId})` : message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Panel Admin"
        description="Ringkasan data, moderasi, dan pengelolaan warung."
        actions={
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="size-4" aria-hidden="true" /> Tambah warung
          </Button>
        }
      />

      {report.error ? (
        <ErrorPanel error={report.error} onRetry={report.reload} />
      ) : !report.data ? (
        <LoadingPanel message="Memuat laporan..." />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={Users} label="Pengguna" value={String(report.data.totalUsers)} />
            <Stat icon={Store} label="Warung" value={String(report.data.totalStalls)} />
            <Stat icon={MessageSquareText} label="Review" value={String(report.data.totalReviews)} />
            <Stat icon={Star} label="Rata-rata rating" value={formatRating(report.data.averageRating)} />
          </div>
          <Card className="mb-6 p-5">
            <h2 className="mb-3 text-lg font-bold">Warung per kategori</h2>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {report.data.stallsByCategory.map((item) => (
                <li key={item.category ?? 'none'} className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold">
                  {item.category ?? 'Tanpa kategori'} <span className="text-primary-dark">{item.total}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      <h2 className="mb-3 text-xl font-bold">Semua warung</h2>
      {stalls.error ? (
        <ErrorPanel error={stalls.error} onRetry={stalls.reload} />
      ) : !stalls.data ? (
        <LoadingPanel message="Memuat warung..." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3">Warung</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stalls.data.items.map((stall) => (
                <tr key={stall.id}>
                  <td className="px-4 py-3 font-semibold">
                    <div className="flex items-center gap-3">
                      <EntityImage
                        src={stall.imageUrl}
                        alt={`Foto ${stall.name}`}
                        className="size-10 shrink-0 rounded-control"
                        iconClassName="size-4"
                      />
                      <Link to={`/stalls/${stall.id}`} className="hover:text-primary">{stall.name}</Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{stall.category ?? '-'}</td>
                  <td className="px-4 py-3">{formatRating(stall.avgRating)} ({stall.reviewCount})</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/admin/stalls/${stall.id}`}
                        aria-label={`Kelola warung ${stall.name}`}
                        title="Kelola warung (ubah foto & menu)"
                        className="grid size-8 place-items-center rounded-control text-text-muted hover:bg-surface-muted hover:text-primary"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Link>
                      <button type="button" aria-label={`Hapus warung ${stall.name}`} onClick={() => { setDeleteError(null); setToDelete(stall) }} className="grid size-8 place-items-center rounded-control text-text-muted hover:bg-danger-bg hover:text-danger">
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {isCreating ? (
        <StallFormModal onClose={() => setIsCreating(false)} onSaved={stallCreated} />
      ) : null}

      {toDelete ? (
        <ConfirmDialog
          title="Hapus warung?"
          message={`Warung "${toDelete.name}" akan dihapus. Warung yang masih punya menu atau review akan ditolak server.`}
          error={deleteError}
          isBusy={isDeleting}
          onClose={() => setToDelete(null)}
          onConfirm={() => void confirmDelete(toDelete)}
        />
      ) : null}
    </>
  )
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="grid size-11 place-items-center rounded-control bg-surface-muted text-primary"><Icon className="size-5" aria-hidden="true" /></span>
      <div>
        <p className="mb-0 text-2xl font-extrabold leading-none">{value}</p>
        <p className="mb-0 mt-1 text-xs font-semibold text-text-muted">{label}</p>
      </div>
    </Card>
  )
}
