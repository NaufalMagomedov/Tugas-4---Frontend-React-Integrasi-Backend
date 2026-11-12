import { Check, Circle } from 'lucide-react'
import { passwordChecks } from '../lib/validation'

/** Checklist yang berubah hijau saat syarat password terpenuhi (aturan sama dengan backend). */
export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="mt-2 grid gap-1 sm:grid-cols-2" aria-label="Syarat password">
      {passwordChecks(password).map((check) => (
        <li key={check.label} className={`flex items-center gap-1.5 text-xs ${check.valid ? 'text-success' : 'text-text-muted'}`}>
          {check.valid ? <Check className="size-3.5" aria-hidden="true" /> : <Circle className="size-3.5" aria-hidden="true" />}
          {check.label}
        </li>
      ))}
    </ul>
  )
}
