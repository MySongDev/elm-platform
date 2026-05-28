<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTabsStore } from '@/entities/tab'
import { transformI18n } from '@/shared/i18n'
import TabBarItem from './TabBarItem.vue'
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
      <TabBarItem
        v-for="item in tabViews"
        :key="item.tab.fullPath"
        :tab="item.tab"
        :title="item.title"
        :active="item.active"
        :item-class="item.itemClass"
        @click="handleTabClick"
      />
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

</style>
