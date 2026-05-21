import type { FlatRoute } from '@/shared/lib/menu'

export interface SearchHistoryItem {
  path: ''
  title: string
  icon?: string
  isHistory: true
}

export type SearchDisplayItem = FlatRoute | SearchHistoryItem
