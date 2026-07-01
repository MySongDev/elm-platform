import { chinaCities, citiesByLetter } from '@/data/china-cities'
import { formatCities } from '@/utils/format/formatCities'
import { useSWR } from './useSWR'

export function useCities() {
  return useSWR({
    key: 'cities_all',
    fetcher: async () => {
      const res = citiesByLetter
      return formatCities(res)
    },
    expire: 24 * 60 * 60 * 1000,
  })
}
