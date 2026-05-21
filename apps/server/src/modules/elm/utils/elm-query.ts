export function toStringValue(value: unknown, fallback = '') {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function toNumberValue(value: unknown, fallback = 0) {
  const source = Array.isArray(value) ? value[0] : value;
  const result = Number(source);
  return Number.isFinite(result) ? result : fallback;
}

export function nextNumberId(values: number[]) {
  return values.length ? Math.max(...values) + 1 : 1;
}

export function parseGeoHash(
  geohash?: string,
  latitude?: number,
  longitude?: number,
): [number, number] {
  if (geohash) {
    const [lat, lng] = geohash.split(',').map((item) => Number(item));
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lat, lng];
    }
  }

  return [
    Number.isFinite(latitude) ? Number(latitude) : 31.22967,
    Number.isFinite(longitude) ? Number(longitude) : 121.4762,
  ];
}
