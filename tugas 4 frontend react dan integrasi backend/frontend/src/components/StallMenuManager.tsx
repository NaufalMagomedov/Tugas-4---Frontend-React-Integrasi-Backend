import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { MenuFormModal } from './MenuFormModal.tsx'
import { EntityImage } from './EntityImage.tsx'
import { Badge, Button, ConfirmDialog, ErrorPanel } from './ui.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { useApiData } from '../hooks/useApiData.ts'
import { deleteMenu, getStallMenus } from '../lib/api.ts'
import { describeError } from '../lib/errors.ts'
import { formatRupiah } from '../lib/format.ts'
import type { MenuItem } from '../types/api.ts'

type Dialog = { type: 'menu'; menu?: MenuItem } | { type: 'delete-menu'; menu: MenuItem }

interface Props {
  stallId: number
  /** Dipanggil setelah menu berubah (mis. agar halaman induk ikut memuat ulang). */
  onChanged?: () => void
}

/**
 * Pengelolaan menu satu warung: daftar + tambah/ubah/hapus.
 * Dipakai bersama oleh dashboard owner dan halaman kelola admin agar
 * perilaku dan tampilannya konsisten.
 */
export function StallMenuManager({ stallId, onChanged }: Props) {
  const { showToast } = useToast()
  const menus = useApiData(() => getStallMenus(stallId), [stallId])
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function afterChange(message: string) {
    setDialog(null)
    showToast({ tone: 'success', message })
    menus.reload()
    onChanged?.()
  }

  async function confirmDelete(menu: MenuItem) {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteMenu(menu.id)
      afterChange('Menu berhasil dihapus.')
    } catch (err) {
      const { message, requestId } = describeError(err)
      setDeleteError(requestId ? `${message} (kode: ${requestId})` : message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h3 className="mb-0 text-sm font-bold uppercase tracking-wide text-text-muted">
          Menu{menus.data ? ` (${menus.data.length})` : ''}
        </h3>
        <Button variant="ghost" className="h-8" onClick={() => setDialog({ type: 'menu' })}>
          <Plus className="size-4" aria-hidden="true" /> Tambah menu
        </Button>
      </div>

      {menus.error ? (
        <div className="mt-3">
          <ErrorPanel error={menus.error} onRetry={menus.reload} />
        </div>
      ) : !menus.data ? (
        <p className="mb-0 mt-3 rounded-control bg-surface-muted p-4 text-sm text-text-muted">Memuat menu...</p>
      ) : menus.data.length === 0 ? (
        <p className="mb-0 mt-3 rounded-control bg-surface-muted p-4 text-sm text-text-muted">Belum ada menu di warung ini.</p>
      ) : (
        <ul className="m-0 mt-2 list-none divide-y divide-border p-0">
          {menus.data.map((menu) => (
            <li key={menu.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <EntityImage
                  src={menu.imageUrl}
                  alt={`Foto ${menu.name}`}
                  className="size-12 shrink-0 rounded-control"
                  iconClassName="size-4"
                />
                <div className="min-w-0">
                  <p className="mb-0.5 font-semibold">{menu.name}</p>
                  <Badge tone={menu.isAvailable ? 'success' : 'danger'}>
                    {menu.isAvailable ? 'Tersedia' : 'Habis'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="mr-2 font-bold text-primary-dark">{formatRupiah(menu.price)}</span>
                <button
                  type="button"
                  aria-label={`Ubah menu ${menu.name}`}
                  onClick={() => setDialog({ type: 'menu', menu })}
                  className="grid size-8 place-items-center rounded-control text-text-muted hover:bg-surface-muted hover:text-text"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Hapus menu ${menu.name}`}
                  onClick={() => {
                    setDeleteError(null)
                    setDialog({ type: 'delete-menu', menu })
                  }}
                  className="grid size-8 place-items-center rounded-control text-text-muted hover:bg-danger-bg hover:text-danger"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {dialog?.type === 'menu' ? (
        <MenuFormModal
          stallId={stallId}
          menu={dialog.menu}
          onClose={() => setDialog(null)}
          onSaved={afterChange}
        />
      ) : null}
      {dialog?.type === 'delete-menu' ? (
        <ConfirmDialog
          title="Hapus menu?"
          message={`Menu "${dialog.menu.name}" akan dihapus permanen.`}
          error={deleteError}
          isBusy={isDeleting}
          onClose={() => setDialog(null)}
          onConfirm={() => void confirmDelete(dialog.menu)}
        />
      ) : null}
    </>
  )
}
