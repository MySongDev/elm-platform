import {
  nextNumberId,
  parseGeoHash,
  toNumberValue,
  toStringValue,
} from './elm-query';

describe('elm-query utils', () => {
  describe('toStringValue', () => {
    it('returns strings unchanged', () => {
      expect(toStringValue('keyword')).toBe('keyword');
    });

    it('uses the fallback for nullish values', () => {
      expect(toStringValue(undefined, 'default')).toBe('default');
      expect(toStringValue(null, 'default')).toBe('default');
    });

    it('stringifies non-null values', () => {
      expect(toStringValue(12)).toBe('12');
      expect(toStringValue(true)).toBe('true');
    });

    it('uses the first item when the query value is an array', () => {
      expect(toStringValue(['first', 'second'])).toBe('first');
      expect(toStringValue([], 'default')).toBe('default');
    });
  });

  describe('toNumberValue', () => {
    it('parses finite numeric values', () => {
      expect(toNumberValue('18')).toBe(18);
      expect(toNumberValue(9)).toBe(9);
    });

    it('uses the first item when the query value is an array', () => {
      expect(toNumberValue(['7', '8'])).toBe(7);
    });

    it('falls back for non-finite values', () => {
      expect(toNumberValue('not-a-number', 3)).toBe(3);
      expect(toNumberValue(undefined, 3)).toBe(3);
      expect(toNumberValue(null, 3)).toBe(3);
    });

    it('falls back for blank string values', () => {
      expect(toNumberValue('', 3)).toBe(3);
      expect(toNumberValue('   ', 3)).toBe(3);
    });
  });

  describe('nextNumberId', () => {
    it('starts at 1 for an empty collection', () => {
      expect(nextNumberId([])).toBe(1);
    });

    it('returns one greater than the max value', () => {
      expect(nextNumberId([1, 9, 3])).toBe(10);
    });
  });

  describe('parseGeoHash', () => {
    it('reads latitude and longitude from a valid geohash', () => {
      expect(parseGeoHash('31.2,121.4')).toEqual([31.2, 121.4]);
    });

    it('uses explicit coordinates when geohash is invalid', () => {
      expect(parseGeoHash('bad', 30.1, 120.2)).toEqual([30.1, 120.2]);
    });

    it('uses explicit coordinates when geohash is incomplete', () => {
      expect(parseGeoHash('31.2,', 30.1, 120.2)).toEqual([30.1, 120.2]);
    });

    it('uses Shanghai defaults when coordinates are missing', () => {
      expect(parseGeoHash()).toEqual([31.22967, 121.4762]);
    });
  });
});
