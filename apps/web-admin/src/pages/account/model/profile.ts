import type { UpdateProfileParams } from '@/entities/session'

interface ProfileFormState {
  username: string
  email: string
  phone: string
}

function normalizeOptionalContact(value: string) {
  const trimmed = value.trim()
  return trimmed || null
}

export function createProfileUpdatePayload(form: ProfileFormState): UpdateProfileParams {
  return {
    username: form.username.trim(),
    email: normalizeOptionalContact(form.email),
    phone: normalizeOptionalContact(form.phone),
  }
}
