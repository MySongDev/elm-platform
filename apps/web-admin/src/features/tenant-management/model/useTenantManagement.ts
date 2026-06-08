import type { FormRules } from 'element-plus'
import type { TenantFormState } from './payload'
import type { CreateTenantParams, TenantInfo, TenantListQuery, UpdateTenantParams } from '@/entities/tenant'
import { createTenant, getTenantList, updateTenant } from '@/entities/tenant'
import { createElementPlusCrudFeedback, useConfigCrud } from '@/shared/config-crud'
import { toTenantPayload } from './payload'

export type { TenantFormState } from './payload'

const defaultForm: TenantFormState = {
  code: '',
  name: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  planCode: 'standard',
  remark: '',
  _tenantId: undefined,
}

export function useTenantManagement() {
  const crud = useConfigCrud<TenantInfo, TenantListQuery, TenantFormState, CreateTenantParams | UpdateTenantParams, number>({
    getDefaultQuery: () => ({
      name: '',
      status: '' as TenantListQuery['status'],
    }),
    getDefaultForm: () => ({ ...defaultForm }),
    fetchList: async () => {
      return await getTenantList()
    },
    createItem: async (payload) => {
      await createTenant(payload as CreateTenantParams)
    },
    updateItem: async (id, payload) => {
      await updateTenant(id, payload as UpdateTenantParams)
    },
    deleteItem: async () => {},
    getFormId: form => form._tenantId ?? 0,
    getRowId: row => row.id,
    filterItem: (item, query) => {
      const nameMatched = !query.name || item.name.includes(query.name) || item.code.includes(query.name)
      const statusMatched = !query.status || item.status === query.status
      return nameMatched && statusMatched
    },
    toForm: row => ({
      code: row.code,
      name: row.name,
      contactName: row.contactName || '',
      contactPhone: row.contactPhone || '',
      contactEmail: row.contactEmail || '',
      planCode: row.planCode,
      remark: row.remark || '',
      _tenantId: row.id,
    }),
    toPayload: toTenantPayload,
    deleteConfirm: () => '',
    saveSuccessMessage: ({ isEdit }) => isEdit ? '更新租户成功' : '创建租户成功',
    feedback: createElementPlusCrudFeedback(),
  })

  const rules = computed<FormRules>(() => ({
    code: [
      {
        required: true,
        message: '请输入租户编码',
        trigger: 'blur',
      },
      {
        pattern: /^[a-z][a-z0-9-]*$/,
        message: '编码须小写字母开头，仅含小写字母、数字和连字符',
        trigger: 'blur',
      },
    ],
    name: [
      {
        required: true,
        message: '请输入租户名称',
        trigger: 'blur',
      },
    ],
  }))

  return {
    ...crud,
    rules,
    fetchTenants: crud.fetchRows,
  }
}
