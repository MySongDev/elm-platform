import { searchRestaurants } from './restaurants.js'

export default [
  {
    url: '/v4/restaurants',
    method: 'get',
    response: ({ query }) => {
      const { geohash, keyword } = query
      return searchRestaurants(geohash, keyword)
    },
  },
]
