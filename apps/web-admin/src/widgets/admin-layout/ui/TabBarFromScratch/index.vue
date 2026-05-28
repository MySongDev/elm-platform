<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTabsStore } from '@/entities/tab'
import { transformI18n } from '@/shared/i18n'
import { getTabItemClass, isActiveTab, shouldNavigateTab } from './tabPresentation'

defineOptions({ name: 'TabBarFromScratch' })

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()
const { t } = useI18n()

const tabViews = computed(() =>
  tabsStore.tabs.map((tab) => {
    const active = isActiveTab(tab.fullPath, route.fullPath)
    return {
      tab,
      active,
      title: tabsStore.getTitle(tab, transformI18n),
      itemClass: getTabItemClass({
        active,
        fixed: tab.fixed,
      }),
    }
  }),
)

function handleTabClick(fullPath: string) {
  if (!shouldNavigateTab(fullPath, route.fullPath))
    return

  router.push(fullPath)
}
</script>

<template>
  <div class="tab-bar-from-scratch">
    <div class="tab-track" role="tablist" :aria-label="t('tabs.openedPages')">
      <button
        v-for="item in tabViews"
        :key="item.tab.fullPath"
        class="tab-item"
        :class="item.itemClass"
        type="button"
        role="tab"
        :aria-selected="item.active"
        :title="item.title"
        @click="handleTabClick(item.tab.fullPath)"
      >
        <el-icon v-if="item.tab.icon" class="tab-icon">
          <SvgIcon :icon-name="item.tab.icon" />
        </el-icon>
        <span class="tab-title">{{ item.title }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tab-bar-from-scratch {
  display: flex;
  align-items: center;
  height: $tab-bar-height;
  user-select: none;
  background: $bg-white;
  border-bottom: 1px solid $border-light;
  box-shadow: 0 0 1px rgb(0 0 0 / 42%);
}

.tab-track {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0 8px;
  overflow: hidden;
  white-space: nowrap;
}

.tab-item {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: center;
  justify-content: center;
  max-width: 180px;
  height: 30px;
  padding: 0 12px;
  margin-right: 4px;
  font: inherit;
  font-size: 12px;
  line-height: 30px;
  color: $text-regular;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 4px;
  transition:
    color 0.2s,
    background 0.2s,
    box-shadow 0.2s;
}

.tab-item:hover {
  color: $primary-color;
  background: rgba($primary-color, 0.08);
}

.tab-item.is-active {
  font-weight: 500;
  color: $primary-color;
  background: rgba($primary-color, 0.1);
  box-shadow: 0 0 0 1px rgba($primary-color, 0.14) inset;
}

.tab-item.is-active::after {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 16px;
  height: 2px;
  content: '';
  background: $primary-color;
  border-radius: 1px;
  transform: translateX(-50%);
}

.tab-title {
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-icon {
  flex-shrink: 0;
  font-size: 14px;
}
</style>
