import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { AuthShell } from '../components/AuthShell.tsx'
import { Alert, Button, Field, PasswordField, Spinner, inputClass } from '../components/ui.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { describeError, getFieldErrors, toApiError } from '../lib/errors.ts'
import { homeForRole } from '../lib/routes.ts'
import {
  EMPTY_LOGIN,
  LOGIN_FIELDS,
  firstErrorField,
  validateLoginForm,
  type FormErrors,
  type LoginField,
} from '../lib/validation.ts'

export function LoginPage() {
  const { user, isReady, login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const [values, setValues] = useState(EMPTY_LOGIN)
  const [errors, setErrors] = useState<FormErrors<LoginField>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sudah login (mis. membuka /login lewat URL): arahkan ke halaman rolenya.
  if (isReady && user && !isSubmitting) return <Navigate to={from ?? homeForRole(user.role)} replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const found = validateLoginForm(values)
    setErrors(found)
    const first = firstErrorField(found, LOGIN_FIELDS)
    if (first) {
      document.getElementById(`login-${first}`)?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      const loggedIn = await login({ email: values.email.trim(), password: values.password })
      // Toast sukses HANYA setelah backend mengonfirmasi.
      showToast({ tone: 'success', message: 'Berhasil masuk.', description: `Halo, ${loggedIn.name}.` })
      navigate(from ?? homeForRole(loggedIn.role), { replace: true })
    } catch (error) {
      const apiError = toApiError(error)
      const fieldErrors = getFieldErrors(apiError)

      if (apiError.code === 'VALIDATION_ERROR' && Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      } else {
        const { message, requestId } = describeError(apiError)
        setFormError(requestId ? `${message} (kode: ${requestId})` : message)
      }
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-extrabold">Masuk ke Madyang Lurr!!</h1>
      <p className="mb-6 mt-1 text-sm text-text-muted">Gunakan akun customer, owner, atau admin.</p>

      <form onSubmit={submit} noValidate className="grid gap-4">
        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <Field label="Email" htmlFor="login-email" error={errors.email}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className={`${inputClass} pl-9 ${errors.email ? 'border-danger' : ''}`}
              value={values.email}
              onChange={(e) => {
                setValues({ ...values, email: e.target.value })
                setErrors({ ...errors, email: undefined })
              }}
              aria-invalid={errors.email ? true : undefined}
            />
          </div>
        </Field>

        <PasswordField
          id="login-password"
          label="Password"
          autoComplete="current-password"
          value={values.password}
          error={errors.password}
          onChange={(e) => {
            setValues({ ...values, password: e.target.value })
            setErrors({ ...errors, password: undefined })
          }}
        />

        <Button type="submit" disabled={isSubmitting} className="mt-1 w-full">
          {isSubmitting ? <Spinner /> : null}
          {isSubmitting ? 'Memeriksa...' : 'Masuk'}
        </Button>
      </form>

      <p className="mb-0 mt-6 text-center text-sm text-text-muted">
        Belum punya akun?{' '}
        <Link to="/register" className="font-bold text-primary hover:text-primary-dark">Daftar sebagai pelanggan</Link>
      </p>
    </AuthShell>
  )
}
