/**
 * @file 租户列表状态
 * @domain pages/platform/tenant
 * @description 有副作用：全量加载与本地筛选租户，维护列表错误及状态变更流程。
 */

import type { TenantEvent, TenantInfo, TenantListQuery } from '@/entities/tenant'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onScopeDispose, reactive, shallowRef } from 'vue'
import { getTenantList, transitionTenant } from '@/entities/tenant'

export function useTenantList() {
  const loading = shallowRef(false)
  const error = shallowRef<unknown>(null)
  const tenants = shallowRef<TenantInfo[]>([])
  const query = reactive<TenantListQuery>({
    name: '',
    status: '',
  })
  let fetchVersion = 0
  let transitioning = false
  let disposed = false

  const filteredData = computed(() => tenants.value.filter(tenant => (
    (!query.name || tenant.name.includes(query.name) || tenant.code.includes(query.name))
    && (!query.status || tenant.status === query.status)
  )))

  async function fetchTenants() {
    if (disposed)
      return
    const version = ++fetchVersion
    loading.value = true
    error.value = null
    try {
      const result = await getTenantList()
      // 刷新或销毁页面后，旧响应不能覆盖新列表，也不能清掉新请求的 loading。
      if (version === fetchVersion)
        tenants.value = result
    }
    catch (caughtError) {
      if (version === fetchVersion)
        error.value = caughtError
    }
    finally {
      if (version === fetchVersion)
        loading.value = false
    }
  }

  function resetQuery() {
    Object.assign(query, {
      name: '',
      status: '',
    })
  }

  async function handleTransition(tenant: TenantInfo, event: TenantEvent) {
    if (transitioning || disposed)
      return
    transitioning = true
    try {
      const result = await ElMessageBox.prompt(
        `确认对租户「${tenant.name}」执行操作：${event}？`,
        '状态变更',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          inputPlaceholder: '变更原因（可选）',
          inputType: 'textarea',
        },
      ).then(value => value, () => null)
      if (!result || disposed)
        return
      await transitionTenant(tenant.id, event, { reason: result.value || undefined })
      if (disposed)
        return
      ElMessage.success('状态变更成功')
      await fetchTenants()
    }
    catch {
      // 状态请求失败由 shared HTTP 提示，保留当前列表供再次操作。
    }
    finally {
      transitioning = false
    }
  }

  onScopeDispose(() => {
    disposed = true
    fetchVersion++
  })

  return {
    loading,
    error,
    query,
    filteredData,
    resetQuery,
    fetchTenants,
    handleTransition,
  }
}
