export const shopEndpoints = {
  list: 'shopping/restaurants',
  detail: shopId => `/shopping/restaurant/${shopId}`,
  menu: '/shopping/v2/menu',
  ratingTags: shopId => `/ugc/v2/restaurants/${shopId}/ratings/tags`,
  ratings: shopId => `/ugc/v2/restaurants/${shopId}/ratings`,
}
