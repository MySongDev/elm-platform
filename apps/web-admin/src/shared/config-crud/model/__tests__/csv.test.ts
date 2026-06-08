import type { ConfigTableColumn } from '../table'
import { describe, expect, it } from 'vitest'
import { buildCsvContent, escapeCsvCell } from '../csv'

interface Row {
  id: number
  name: string
  note: string
}

const columns: ConfigTableColumn<Row>[] = [
  {
    prop: 'id',
    label: 'ID',
  },
  {
    prop: 'name',
    label: '名称',
  },
  {
    prop: 'note',
    label: '备注',
    formatter: row => row.note,
  },
  {
    key: 'hidden',
    label: '不导出',
    exportable: false,
  },
]

describe('csv helpers', () => {
  it('escapes commas, quotes, and newlines', () => {
    expect(escapeCsvCell('hello')).toBe('hello')
    expect(escapeCsvCell('a,b')).toBe('"a,b"')
    expect(escapeCsvCell('a"b')).toBe('"a""b"')
    expect(escapeCsvCell('a\nb')).toBe('"a\nb"')
  })

  it('builds csv content from exportable columns and rows', () => {
    const content = buildCsvContent(columns, [
      {
        id: 1,
        name: '南山轻食',
        note: '好评,多',
      },
      {
        id: 2,
        name: '川味"小馆',
        note: '',
      },
    ])

    expect(content).toBe([
      'ID,名称,备注',
      '1,南山轻食,"好评,多"',
      '2,"川味""小馆",',
    ].join('\r\n'))
  })
})
