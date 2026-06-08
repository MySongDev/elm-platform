export type AdminEmptyReason = 'no-data' | 'no-filter-result'
export type AdminSkeletonVariant = 'table' | 'form' | 'card'
export type AdminStateKind = 'forbidden' | 'loading' | 'error' | 'empty' | 'ready'

export interface ResolveAdminStateKindInput {
  forbidden?: boolean
  loading?: boolean
  error?: unknown | string
  empty?: boolean
}

export function resolveAdminStateKind(input: ResolveAdminStateKindInput): AdminStateKind {
  if (input.forbidden)
    return 'forbidden'
  if (input.loading)
    return 'loading'
  if (input.error != null)
    return 'error'
  if (input.empty)
    return 'empty'
  return 'ready'
}
