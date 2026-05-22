import type { CreateUserParams, UpdateUserParams } from '@/entities/user'

export type UserFormState = CreateUserParams & { _userId?: number }

function normalizeCreateOptionalText(value?: string) {
  const text = value?.trim()
  return text || undefined
}

function normalizeUpdateOptionalText(value?: string) {
  const text = value?.trim()
  return text || null
}

export function toUserPayload(form: UserFormState): CreateUserParams | UpdateUserParams {
  const { _userId, password, email, phone, ...rest } = form

  if (_userId) {
    return {
      ...rest,
      email: normalizeUpdateOptionalText(email),
      phone: normalizeUpdateOptionalText(phone),
    }
  }

  return {
    ...rest,
    password,
    email: normalizeCreateOptionalText(email),
    phone: normalizeCreateOptionalText(phone),
  }
}
