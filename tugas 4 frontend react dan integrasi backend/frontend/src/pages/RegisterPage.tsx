import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, UserRound } from 'lucide-react'
import { AuthShell } from '../components/AuthShell.tsx'
import { PasswordChecklist } from '../components/PasswordChecklist.tsx'
import { Alert, Button, Field, PasswordField, Spinner, inputClass } from '../components/ui.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { describeError, getFieldErrors } from '../lib/errors.ts'
import {
  EMPTY_REGISTER,
  REGISTER_FIELDS,
  firstErrorField,
  validateRegisterForm,
  type FormErrors,
  type RegisterField,
} from '../lib/validation.ts'

export function RegisterPage() {
  const { register } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [values, setValues] = useState(EMPTY_REGISTER)
  const [errors, setErrors] = useState<FormErrors<RegisterField>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function change(field: RegisterField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const found = validateRegisterForm(values)
    setErrors(found)
    const first = firstErrorField(found, REGISTER_FIELDS)
    if (first) {
      document.getElementById(`register-${first}`)?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      // confirmPassword hanya untuk form; backend menolak field asing.
      const message = await register({ name: values.name.trim(), email: values.email.trim(), password: values.password })
      showToast({ tone: 'success', message: 'Akun berhasil dibuat.', description: message })
      navigate('/login', { replace: true })
    } catch (error) {
      // 409 EMAIL_TAKEN membawa field "email" -> tampil di bawah input email.
      const fieldErrors = getFieldErrors(error)
      const known = Object.fromEntries(Object.entries(fieldErrors).filter(([key]) => REGISTER_FIELDS.includes(key as RegisterField)))

      if (Object.keys(known).length > 0) {
        setErrors(known)
        document.getElementById(`register-${Object.keys(known)[0]}`)?.focus()
      } else {
        const { message, requestId } = describeError(error)
        setFormError(requestId ? `${message} (kode: ${requestId})` : message)
      }
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-extrabold">Buat akun pelanggan</h1>
      <p className="mb-6 mt-1 text-sm text-text-muted">Daftar untuk menulis review warung favoritmu.</p>

      <form onSubmit={submit} noValidate className="grid gap-4">
        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <Field label="Nama lengkap" htmlFor="register-name" error={errors.name}>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <input id="register-name" autoComplete="name" className={`${inputClass} pl-9 ${errors.name ? 'border-danger' : ''}`} value={values.name} onChange={(e) => change('name', e.target.value)} aria-invalid={errors.name ? true : undefined} />
          </div>
        </Field>

        <Field label="Email" htmlFor="register-email" error={errors.email}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <input id="register-email" type="email" autoComplete="email" className={`${inputClass} pl-9 ${errors.email ? 'border-danger' : ''}`} value={values.email} onChange={(e) => change('email', e.target.value)} aria-invalid={errors.email ? true : undefined} />
          </div>
        </Field>

        <div>
          <PasswordField id="register-password" label="Password" autoComplete="new-password" value={values.password} error={errors.password} onChange={(e) => change('password', e.target.value)} />
          <PasswordChecklist password={values.password} />
        </div>

        <PasswordField id="register-confirmPassword" label="Konfirmasi password" autoComplete="new-password" value={values.confirmPassword} error={errors.confirmPassword} onChange={(e) => change('confirmPassword', e.target.value)} />

        <Button type="submit" disabled={isSubmitting} className="mt-1 w-full">
          {isSubmitting ? <Spinner /> : null}
          {isSubmitting ? 'Mendaftarkan...' : 'Daftar'}
        </Button>
      </form>

      <p className="mb-0 mt-6 text-center text-sm text-text-muted">
        Sudah punya akun?{' '}
        <Link to="/login" className="font-bold text-primary hover:text-primary-dark">Masuk</Link>
      </p>
    </AuthShell>
  )
}
