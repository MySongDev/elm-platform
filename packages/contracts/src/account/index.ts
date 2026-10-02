export const accountStatuses = ['ACTIVE', 'DISABLED'] as const
export type AccountStatus = (typeof accountStatuses)[number]

export const DEFAULT_ACCOUNT_STATUS: AccountStatus = 'ACTIVE'
