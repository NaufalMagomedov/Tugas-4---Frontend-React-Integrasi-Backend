import { AtSign, IdCard, UserRound } from 'lucide-react'
import { Alert, Badge, Card, ErrorPanel, LoadingPanel, PageHeader } from '../components/ui.tsx'
import { useApiData } from '../hooks/useApiData.ts'
import { getProfile } from '../lib/api.ts'
import { formatRole, initials } from '../lib/format.ts'
import type { UserRole } from '../types/api.ts'

const roleTone: Record<UserRole, 'primary' | 'warning' | 'neutral'> = {
  admin: 'warning',
  owner: 'primary',
  customer: 'neutral',
}

export function ProfilePage() {
  // GET /auth/profile membaca ulang user dari database (bukan hanya payload token),
  // jadi perubahan role/nama di server langsung terlihat di halaman ini.
  const profile = useApiData(getProfile, [])

  if (profile.error) return <ErrorPanel error={profile.error} onRetry={profile.reload} />
  if (!profile.data) return <LoadingPanel message="Memuat profil..." />

  const user = profile.data

  return (
    <>
      <PageHeader
        eyebrow="Akun"
        title="Profil Saya"
        description="Data akun yang tersimpan di server, dimuat ulang dari database."
      />

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-primary/10 text-xl font-extrabold text-primary-dark">
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <h2 className="mb-1 text-xl font-bold">{user.name}</h2>
            <p className="mb-0 text-sm text-text-muted">{user.email}</p>
          </div>
          <div className="ml-auto">
            <Badge tone={roleTone[user.role]}>{formatRole(user.role)}</Badge>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
          <div>
            <dt className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <IdCard className="size-3.5" aria-hidden="true" /> ID akun
            </dt>
            <dd className="m-0 font-bold">{user.id}</dd>
          </div>
          <div>
            <dt className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <AtSign className="size-3.5" aria-hidden="true" /> Email
            </dt>
            <dd className="m-0 break-all font-bold">{user.email}</dd>
          </div>
          <div>
            <dt className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <UserRound className="size-3.5" aria-hidden="true" /> Peran
            </dt>
            <dd className="m-0 font-bold">{formatRole(user.role)}</dd>
          </div>
        </dl>
      </Card>

      <div className="mt-4">
        <Alert tone="info">
          Halaman ini memakai endpoint <code>GET /auth/profile</code> yang membaca data terbaru dari database,
          berbeda dari <code>GET /auth/me</code> yang hanya mengembalikan isi token sesi.
        </Alert>
      </div>
    </>
  )
}
