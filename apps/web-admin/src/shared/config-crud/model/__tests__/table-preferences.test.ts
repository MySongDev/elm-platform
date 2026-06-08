import type { ConfigTableColumn } from '../table'
import { describe, expect, it } from 'vitest'
import {
  getColumnPreferenceKey,
  getDefaultVisibleColumnKeys,
  mergeVisibleColumnKeys,
  parseStoredVisibleColumnKeys,
} from '../table-preferences'

interface Row {
  id: number
  name: string
  category: string
}

const columns: ConfigTableColumn<Row>[] = [
  {
    prop: 'id',
    label: 'ID',
    hideable: false,
  },
  {
    prop: 'name',
    label: '名称',
  },
  {
    key: 'category-column',
    prop: 'category',
    label: '分类',
    defaultVisible: false,
  },
]

describe('table preference helpers', () => {
  it('resolves stable column keys from key, prop, and index fallback', () => {
    expect(getColumnPreferenceKey({
      key: 'custom',
      label: '自定义',
    }, 0)).toBe('custom')
    expect(getColumnPreferenceKey({
      prop: 'name',
      label: '名称',
    } as ConfigTableColumn<Row>, 1)).toBe('name')
    expect(getColumnPreferenceKey({ label: '操作' }, 2)).toBe('column-2')
  })

  it('uses defaultVisible false to hide columns by default', () => {
    expect(getDefaultVisibleColumnKeys(columns)).toEqual(['id', 'name'])
  })

  it('parses stored string arrays and ignores invalid storage', () => {
    expect(parseStoredVisibleColumnKeys('["id","name"]')).toEqual(['id', 'name'])
    expect(parseStoredVisibleColumnKeys('{"id":true}')).toBeNull()
    expect(parseStoredVisibleColumnKeys('not-json')).toBeNull()
    expect(parseStoredVisibleColumnKeys(null)).toBeNull()
  })

  it('merges stored keys with available columns and keeps non-hideable columns visible', () => {
    expect(mergeVisibleColumnKeys(columns, ['category-column'])).toEqual(['category-column', 'id'])
  })

  it('falls back to default visible keys when stored keys are invalid for current columns', () => {
    expect(mergeVisibleColumnKeys(columns, ['missing'])).toEqual(['id', 'name'])
  })
})
