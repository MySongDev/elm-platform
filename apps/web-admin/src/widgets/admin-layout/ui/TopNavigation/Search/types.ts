import type { FlatRoute } from './lib/flatten-menu'

export interface SearchHistoryItem {
  path: ''
  title: string
  icon?: string
  isHistory: true
}

export type SearchDisplayItem = FlatRoute | SearchHistoryItem

export function isSearchHistoryItem(item: SearchDisplayItem): item is SearchHistoryItem {
  return 'isHistory' in item && item.isHistory
}
