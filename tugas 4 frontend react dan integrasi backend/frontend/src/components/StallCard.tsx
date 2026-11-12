import { ArrowRight, MapPin, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatRating } from '../lib/format.ts'
import type { Stall } from '../types/api.ts'
import { Badge, Card } from './ui.tsx'
import { EntityImage } from './EntityImage.tsx'

export function StallCard({ stall }: { stall: Stall }) {
  return (
    <Card className="flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-primary/30">
      <EntityImage
        src={stall.imageUrl}
        alt={`Foto ${stall.name}`}
        className="mb-4 aspect-[16/9] w-full rounded-control"
        iconClassName="size-6"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {stall.category ? <Badge tone="primary">{stall.category}</Badge> : null}
            {stall.isPopular ? <Badge tone="warning">Populer</Badge> : null}
          </div>
          <h2 className="mb-1 text-lg font-bold leading-snug">{stall.name}</h2>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 rounded-control bg-surface-muted px-2.5 py-2">
          <span className="inline-flex items-center gap-1 text-sm font-extrabold text-warning">
            <Star className="size-4 fill-warning" aria-hidden="true" />
            {formatRating(stall.avgRating)}
          </span>
          <span className="text-[10px] font-semibold text-text-muted">{stall.reviewCount} review</span>
        </div>
      </div>

      <p className={`mb-4 mt-3 text-sm ${stall.description ? 'line-clamp-2 leading-relaxed text-text-muted' : 'italic text-text-muted'}`}>
        {stall.description || 'Belum ada deskripsi.'}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="inline-flex min-w-0 items-center gap-1 text-xs text-text-muted">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{stall.location || 'Lokasi belum diisi'}</span>
        </span>
        <Link
          to={`/stalls/${stall.id}`}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark"
        >
          Lihat detail
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  )
}
