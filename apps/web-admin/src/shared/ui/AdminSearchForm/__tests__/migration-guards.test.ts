import { describe, expect, it } from 'vitest'
import adminSearchFormSource from '../index.vue?raw'

describe('adminSearchForm migration guards', () => {
  it('does not depend on the deleted SearchField wrapper', () => {
    expect(adminSearchFormSource).not.toContain('./SearchField.vue')
    expect(adminSearchFormSource).not.toContain('AdminSearchFieldRenderer')
    expect(adminSearchFormSource).toContain('@/shared/ui/form/FieldRenderer/index.vue')
  })

  it('keeps all built-in field renderer controls on the shared search width token', () => {
    expect(adminSearchFormSource).toContain(':deep(.el-input)')
    expect(adminSearchFormSource).toContain(':deep(.el-input-number)')
    expect(adminSearchFormSource).toContain(':deep(.el-select)')
    expect(adminSearchFormSource).toContain(':deep(.el-date-editor)')
    expect(adminSearchFormSource).toContain('width: var(--app-search-control-width);')
  })
})
