# Web User Local Mock

## Enable

- `pnpm --filter @elm-platform/web-user run dev:mock`
- or `VITE_USE_MOCK=true`

## Behavior

Matched requests return `X-Elm-Mock: web-user`.
Unmatched requests continue to the Vite proxy; this is not a fully offline mode.

## Covered Routes

| Method | Path | Source |
| --- | --- | --- |
| GET | `/v1/users/1/addresses` | `address.js` |
| GET | `/v4/restaurants` | `index.js` + `restaurants.js` |
| GET | `/v1/pois` | `pois.js` |
| GET | `/api/ugc/v2/restaurants/:restaurant_id/ratings` | `shopreviews.js` |
| GET | `/ugc/v2/restaurants/:restaurant_id/ratings` | `shopreviews.js` |
| GET | `/api/ugc/v2/restaurants/:restaurant_id/ratings/tags` | `shopreviews.js` |
| GET | `/ugc/v2/restaurants/:restaurant_id/ratings/tags` | `shopreviews.js` |

Authentication, payment, city, food-category, shop-detail, and other unmatched APIs use proxy fallback.