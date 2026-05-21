import { getGroupCity } from '@/services/api/index'
import { formatCities } from '@/untils/formatCities'
import { useSWR } from './useSWR'

export function useCities() {
  return useSWR({
    key: 'cities_all',
    fetcher: async () => {
      const res = await getGroupCity()
      return formatCities(res)
    },
    expire: 24 * 60 * 60 * 1000,
  })
}
