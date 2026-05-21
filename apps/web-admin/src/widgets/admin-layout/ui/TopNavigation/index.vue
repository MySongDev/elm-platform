<script setup lang="ts">
import Breadcrumb from './Breadcrumb/index.vue'
import Hamburger from './Hamburger/index.vue'
import LangSwitcher from './LangSwitcher/index.vue'
import NotificationBell from './NotificationBell/index.vue'
import SearchButton from './SearchButton/index.vue'
import UserMenu from './UserMenu/index.vue'

defineOptions({ name: 'TopNavigation' })

defineProps<{
  collapse: boolean
}>()

const emit = defineEmits<{
  toggleCollapse: []
}>()
</script>

<template>
  <header class="app-header">
    <div class="app-header__left">
      <Hamburger :is-active="collapse" @toggle-click="emit('toggleCollapse')" />
      <Breadcrumb />
    </div>

    <div class="app-header__right">
      <SearchButton />
      <NotificationBell />
      <LangSwitcher />
      <UserMenu />
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: $header-height;
  padding: 0 16px;
  background: var(--app-bg-surface);
  border-bottom: 1px solid var(--app-border-light);
}

.app-header__left,
.app-header__right {
  display: flex;
  align-items: center;
}

.app-header__left {
  gap: 8px;
  min-width: 0;
}

.app-header__right {
  flex-shrink: 0;
  gap: 12px;
}
</style>
