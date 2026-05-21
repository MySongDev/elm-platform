import { useLocationStore } from '@/stores/modules/store-locations'

import { getMeta } from './meta'

export function attachLocation(config) {
  const meta = getMeta(config)

  if (!meta.location)
    return

  const locationStore = useLocationStore()

  if (locationStore.latitude == null || locationStore.longitude == null) {
    return
  }

  config.headers = config.headers || {}
  config.headers['X-Latitude'] = String(locationStore.latitude)
  config.headers['X-Longitude'] = String(locationStore.longitude)
}
