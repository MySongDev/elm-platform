export const accountStatuses = ['ACTIVE', 'DISABLED'] as const
export type AccountStatus = (typeof accountStatuses)[number]
