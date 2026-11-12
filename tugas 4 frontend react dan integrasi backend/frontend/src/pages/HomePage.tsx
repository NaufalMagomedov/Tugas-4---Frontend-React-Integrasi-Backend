import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, Store } from 'lucide-react'
import { StallCard } from '../components/StallCard.tsx'
import { Button, EmptyState, ErrorPanel, LoadingPanel, PageHeader, inputClass } from '../components/ui.tsx'
import { useApiData } from '../hooks/useApiData.ts'
import { getCategories, getStalls } from '../lib/api.ts'

const PAGE_SIZE = 9

export function HomePage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)

  // Request baru hanya dikirim 350 ms setelah pengguna berhenti mengetik.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => window.clearTimeout(timer)
  }, [search])

  const stalls = useApiData(
    () => getStalls({ search: debouncedSearch, category, page, limit: PAGE_SIZE }),
    [debouncedSearch, category, page],
  )
  const categories = useApiData(getCategories, [])

  const meta = stalls.data?.meta
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1

  return (
    <>
      <PageHeader
        eyebrow="Kantin kampus"
        title="Temukan warung favoritmu"
        description="Cari warung, lihat menu, dan baca review sebelum memutuskan makan di mana."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
          <input
            type="search"
            aria-label="Cari warung"
            placeholder="Cari nama warung..."
            className={`${inputClass} pl-9`}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </div>
        <select
          aria-label="Filter kategori"
          className={inputClass}
          value={category}
          onChange={(event) => {
            setCategory(event.target.value)
            setPage(1)
          }}
        >
          <option value="">Semua kategori</option>
          {(categories.data ?? []).map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      {stalls.error ? (
        <ErrorPanel error={stalls.error} onRetry={stalls.reload} />
      ) : !stalls.data ? (
        <LoadingPanel message="Memuat daftar warung..." />
      ) : stalls.data.items.length === 0 ? (
        <EmptyState icon={Store} title="Warung tidak ditemukan" message="Coba kata kunci atau kategori lain." />
      ) : (
        <>
          <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${stalls.isLoading ? 'opacity-60' : ''}`} aria-busy={stalls.isLoading}>
            {stalls.data.items.map((stall) => (
              <StallCard key={stall.id} stall={stall} />
            ))}
          </div>

          <nav className="mt-8 flex items-center justify-between gap-3" aria-label="Halaman daftar warung">
            <p className="m-0 text-sm text-text-muted">
              {meta?.total} warung &middot; halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                <ChevronLeft className="size-4" aria-hidden="true" /> Sebelumnya
              </Button>
              <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                Berikutnya <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </nav>
        </>
      )}
    </>
  )
}
