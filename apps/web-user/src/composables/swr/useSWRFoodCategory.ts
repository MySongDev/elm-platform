import { getFoodCategoryList } from '@/services/api/api-miste'
import { useSWR } from './useSWR'

export function useFoodCategory() {
  return useSWR({
    key: 'foodCategory_list',
    fetcher: getFoodCategoryList,
    expire: 24 * 60 * 60 * 1000,
  })
}
