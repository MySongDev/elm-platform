export function toStringValue(value: unknown, fallback = '') {
  const source = Array.isArray(value) ? value[0] : value;
  if (typeof source === 'string') return source;
  if (source === null || source === undefined) return fallback;
  return String(source);
}

export function toNumberValue(value: unknown, fallback = 0) {
  const source = Array.isArray(value) ? value[0] : value;
  if (source === null || source === undefined) return fallback;
  if (typeof source === 'string' && source.trim() === '') return fallback;

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
    const parts = geohash.split(',');
    if (parts.length === 2 && parts.every((item) => item.trim() !== '')) {
      const [lat, lng] = parts.map((item) => Number(item));
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return [lat, lng];
      }
    }
  }

  return [
    toNumberValue(latitude, 31.22967),
    toNumberValue(longitude, 121.4762),
  ];
}
