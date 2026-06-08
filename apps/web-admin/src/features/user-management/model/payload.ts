import type { CreateUserParams, UpdateUserParams } from '@/entities/user'

export interface UserFormState {
  username: string
  password: string
  email: string
  phone: string
  role: 'admin' | 'user'
  status: number
  permissions: string[]
  tenantId: number | null
  dataScope: string
  boundShopIds: string[]
  _userId?: number
}

function normalizeCreateOptionalText(value?: string) {
  const text = value?.trim()
  return text || undefined
}

function normalizeUpdateOptionalText(value?: string) {
  const text = value?.trim()
  return text || null
}

export function toUserPayload(form: UserFormState): CreateUserParams | UpdateUserParams {
  const { _userId, password, email, phone, tenantId, dataScope, boundShopIds, ...rest } = form

  const tenantFields = {
    tenantId: dataScope === 'ALL' ? null : tenantId,
    dataScope,
    boundShopIds: dataScope === 'SHOP' ? boundShopIds : [],
  }

  if (_userId) {
    return {
      ...rest,
      ...tenantFields,
      email: normalizeUpdateOptionalText(email),
      phone: normalizeUpdateOptionalText(phone),
    }
  }

  return {
    ...rest,
    ...tenantFields,
    password,
    email: normalizeCreateOptionalText(email),
    phone: normalizeCreateOptionalText(phone),
  }
}
