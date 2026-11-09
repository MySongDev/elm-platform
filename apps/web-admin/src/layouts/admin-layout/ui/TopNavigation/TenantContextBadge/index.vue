<script setup lang="ts">
import { useAuthStore } from '@/entities/session'

defineOptions({ name: 'TenantContextBadge' })

const authStore = useAuthStore()

const label = computed(() => {
  const user = authStore.userInfo
  if (!user)
    return ''

  const dataScope = user.dataScope || 'ALL'

  if (dataScope === 'ALL')
    return '平台管理员 · 全部租户'

  const tenantName = user.tenant?.name || '未知租户'

  if (dataScope === 'SHOP') {
    const shops = user.boundShopIds?.length
      ? `${user.boundShopIds.length} 个店铺`
      : ''
    return `店铺运营 · ${tenantName}${shops ? ` / ${shops}` : ''}`
  }

  return `租户管理员 · ${tenantName}`
})
</script>

<template>
  <span v-if="label" class="tenant-context-badge">
    {{ label }}
  </span>
</template>

<style scoped lang="scss">
.tenant-context-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 12px;
}
</style>
