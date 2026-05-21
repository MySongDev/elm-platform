<script setup lang="ts">
import type { ActivePaneInfo } from './config'
import AccountSidebar from './components/AccountSidebar.vue'
import { accountPanes, activePaneKey, defaultPane } from './config'

defineOptions({ name: 'AccountSettingsView' })

const activePane = ref(defaultPane)

const currentComponent = computed(() => {
  return accountPanes.find(item => item.key === activePane.value)?.component
})

const activePaneInfo = computed<ActivePaneInfo>(() => {
  const pane = accountPanes.find(item => item.key === activePane.value)
  return { label: pane?.label ?? '' }
})

provide(activePaneKey, activePaneInfo)
</script>

<template>
  <el-container class="account-settings-page">
    <AccountSidebar :panes="accountPanes" :active-key="activePane" @change="activePane = $event" />
    <el-main>
      <component :is="currentComponent" />
    </el-main>
  </el-container>
</template>

<style scoped lang="scss">
.account-settings-page {
  height: 100vh;
}

:deep(.el-main) {
  padding: 20px 32px;
  overflow-y: auto;
}
</style>
