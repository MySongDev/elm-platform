<script setup lang="ts">
import { useAuthStore } from '@/entities/session'

defineOptions({ name: 'DataScopeHint' })

const authStore = useAuthStore()

const hint = computed(() => {
  const user = authStore.userInfo
  if (!user)
    return ''

  const dataScope = user.dataScope || 'ALL'

  if (dataScope === 'ALL')
    return '当前数据范围：全部租户'

  const tenantName = user.tenant?.name || '未知租户'

  if (dataScope === 'SHOP') {
    const shops = user.boundShopIds
    if (shops?.length)
      return `当前数据范围：${tenantName} / ${shops.join('、')}`
    return `当前数据范围：${tenantName} / 全部绑定店铺`
  }

  return `当前数据范围：${tenantName}`
})
</script>

<template>
  <div v-if="hint" class="data-scope-hint">
    <el-icon class="data-scope-hint__icon">
      <i-ep-info-filled />
    </el-icon>
    <span>{{ hint }}</span>
  </div>
</template>

<style scoped lang="scss">
.data-scope-hint {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--el-color-info);
  background: var(--el-color-info-light-9);
  border-radius: 4px;
}

.data-scope-hint__icon {
  flex-shrink: 0;
}
</style>
