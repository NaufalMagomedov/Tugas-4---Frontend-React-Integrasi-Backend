import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, MessageSquareText, Star, Trash2, UtensilsCrossed } from 'lucide-react'
import {
  Alert, Badge, Button, Card, ConfirmDialog, EmptyState, ErrorPanel, Field, LoadingPanel, RatingInput, RatingStars, Spinner, textareaClass,
} from '../components/ui.tsx'
import { EntityImage } from '../components/EntityImage.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { useApiData } from '../hooks/useApiData.ts'
import { createReview, deleteReview, getStall, getStallMenus, getStallReviews } from '../lib/api.ts'
import { describeError, getFieldErrors, toApiError } from '../lib/errors.ts'
import { formatDate, formatRating, formatRupiah } from '../lib/format.ts'
import { EMPTY_REVIEW, toReviewPayload, validateReviewForm, type FormErrors, type ReviewField } from '../lib/validation.ts'
import type { Review } from '../types/api.ts'

export function StallDetailPage() {
  const params = useParams()
  const stallId = Number(params.id)
  const { user } = useAuth()
  const { showToast } = useToast()

  // Tiga request berjalan paralel; halaman tampil setelah ketiganya selesai.
  const page = useApiData(
    () => Promise.all([getStall(stallId), getStallMenus(stallId), getStallReviews(stallId)]),
    [stallId],
  )

  const [form, setForm] = useState(EMPTY_REVIEW)
  const [errors, setErrors] = useState<FormErrors<ReviewField>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const [toDelete, setToDelete] = useState<Review | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!Number.isInteger(stallId) || stallId <= 0) {
    return <EmptyState icon={UtensilsCrossed} title="Alamat tidak valid" message="ID warung pada alamat harus berupa angka." action={<Link to="/" className="text-sm font-bold text-primary">Kembali ke daftar</Link>} />
  }
  if (page.error) {
    const notFound = page.error.code === 'STALL_NOT_FOUND'
    return (
      <>
        <BackLink />
        <ErrorPanel error={page.error} onRetry={notFound ? undefined : page.reload} title={notFound ? 'Warung tidak ditemukan' : undefined} />
      </>
    )
  }
  if (!page.data) return <LoadingPanel message="Memuat detail warung..." />

  const [stall, menus, reviews] = page.data
  const myReview = user ? reviews.find((review) => review.userId === user.id) : undefined

  async function submitReview(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const found = validateReviewForm(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setIsSending(true)
    try {
      const saved = await createReview(stallId, toReviewPayload(form))
      showToast({ tone: 'success', message: saved.message })
      setForm(EMPTY_REVIEW)
      page.reload() // rating & jumlah review warung ikut berubah di server
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.code === 'REVIEW_ALREADY_EXISTS') page.reload()
      const fieldErrors = getFieldErrors(apiError)
      if (apiError.code === 'VALIDATION_ERROR' && Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      } else {
        const { message, requestId } = describeError(apiError)
        setFormError(requestId ? `${message} (kode: ${requestId})` : message)
      }
    } finally {
      setIsSending(false)
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteReview(toDelete.id)
      showToast({ tone: 'success', message: 'Review berhasil dihapus.' })
      setToDelete(null)
      page.reload()
    } catch (error) {
      const { message, requestId } = describeError(error)
      setDeleteError(requestId ? `${message} (kode: ${requestId})` : message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <BackLink />

      <Card className="mb-6 p-6">
        <EntityImage
          src={stall.imageUrl}
          alt={`Foto ${stall.name}`}
          className="mb-5 aspect-[21/9] w-full rounded-control"
          iconClassName="size-8"
        />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              {stall.category ? <Badge tone="primary">{stall.category}</Badge> : null}
              {stall.isPopular ? <Badge tone="warning">Populer</Badge> : null}
            </div>
            <h1 className="mb-1 text-3xl font-extrabold">{stall.name}</h1>
            <p className="mb-0 inline-flex items-center gap-1 text-sm text-text-muted">
              <MapPin className="size-4" aria-hidden="true" /> {stall.location || 'Lokasi belum diisi'}
            </p>
          </div>
          <div className="rounded-control bg-surface-muted px-4 py-3 text-center">
            <span className="inline-flex items-center gap-1 text-2xl font-extrabold text-warning">
              <Star className="size-6 fill-warning" aria-hidden="true" /> {formatRating(stall.avgRating)}
            </span>
            <p className="mb-0 text-xs font-semibold text-text-muted">{stall.reviewCount} review</p>
          </div>
        </div>
        {stall.description ? <p className="mb-0 mt-4 max-w-3xl text-sm leading-relaxed text-text-muted">{stall.description}</p> : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section aria-labelledby="menu-heading">
          <h2 id="menu-heading" className="mb-3 text-xl font-bold">Menu</h2>
          {menus.length === 0 ? (
            <EmptyState icon={UtensilsCrossed} title="Belum ada menu" message="Pemilik warung belum menambahkan menu." />
          ) : (
            <Card className="divide-y divide-border">
              {menus.map((menu) => (
                <div key={menu.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <EntityImage
                      src={menu.imageUrl}
                      alt={`Foto ${menu.name}`}
                      className="size-14 shrink-0 rounded-control"
                      iconClassName="size-5"
                    />
                    <div className="min-w-0">
                      <p className="mb-0.5 font-semibold">{menu.name}</p>
                      <Badge tone={menu.isAvailable ? 'success' : 'danger'}>{menu.isAvailable ? 'Tersedia' : 'Habis'}</Badge>
                    </div>
                  </div>
                  <span className="shrink-0 font-bold text-primary-dark">{formatRupiah(menu.price)}</span>
                </div>
              ))}
            </Card>
          )}
        </section>

        <section aria-labelledby="review-heading">
          <h2 id="review-heading" className="mb-3 text-xl font-bold">Review</h2>

          {!user ? (
            <Card className="mb-4 p-4 text-sm text-text-muted">
              <Link to="/login" state={{ from: `/stalls/${stallId}` }} className="font-bold text-primary">Masuk</Link> untuk menulis review.
            </Card>
          ) : myReview ? (
            <div className="mb-4"><Alert tone="info">Kamu sudah mereview warung ini. Hapus review lama bila ingin menulis ulang.</Alert></div>
          ) : (
            <Card className="mb-4 p-4">
              <form onSubmit={submitReview} noValidate className="grid gap-3">
                {formError ? <Alert tone="error">{formError}</Alert> : null}
                <div>
                  <RatingInput value={form.rating} onChange={(rating) => { setForm({ ...form, rating }); setErrors({ ...errors, rating: undefined }) }} />
                  {errors.rating ? <p role="alert" className="mb-0 mt-1.5 text-xs text-danger">{errors.rating}</p> : null}
                </div>
                <Field label="Komentar (opsional)" htmlFor="review-comment" error={errors.comment}>
                  <textarea id="review-comment" className={textareaClass} value={form.comment} maxLength={1000} onChange={(e) => { setForm({ ...form, comment: e.target.value }); setErrors({ ...errors, comment: undefined }) }} />
                </Field>
                <Button type="submit" disabled={isSending} className="justify-self-start">
                  {isSending ? <Spinner /> : null} Kirim review
                </Button>
              </form>
            </Card>
          )}

          {reviews.length === 0 ? (
            <EmptyState icon={MessageSquareText} title="Belum ada review" message="Jadilah yang pertama memberi penilaian." />
          ) : (
            <div className="grid gap-3">
              {reviews.map((review) => {
                const canDelete = user && (user.role === 'admin' || user.id === review.userId)
                return (
                  <Card key={review.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="mb-0.5 text-sm font-bold">{review.userName}</p>
                        <div className="flex items-center gap-2">
                          <RatingStars rating={review.rating} />
                          <span className="text-xs text-text-muted">{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                      {canDelete ? (
                        <button type="button" onClick={() => { setDeleteError(null); setToDelete(review) }} aria-label={`Hapus review ${review.userName}`} className="grid size-8 place-items-center rounded-control text-text-muted transition hover:bg-danger-bg hover:text-danger">
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                    {review.comment ? <p className="mb-0 mt-2 text-sm leading-relaxed">{review.comment}</p> : null}
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {toDelete ? (
        <ConfirmDialog
          title="Hapus review?"
          message={`Review dari ${toDelete.userName} akan dihapus dan rating warung dihitung ulang.`}
          error={deleteError}
          isBusy={isDeleting}
          onClose={() => setToDelete(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </>
  )
}

function BackLink() {
  return (
    <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-dark">
      <ArrowLeft className="size-4" aria-hidden="true" /> Semua warung
    </Link>
  )
}

