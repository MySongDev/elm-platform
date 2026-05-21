<script setup lang="ts">
import { IconSearch as IconEpSearch } from '@iconify-prerendered/vue-ep'
import { useTemplateRef } from 'vue'
import TopNavigationAction from '../components/TopNavigationAction.vue'
import SearchDialog from '../Search/index.vue'

defineOptions({ name: 'SearchButton' })

const { t } = useI18n()
const searchDialogRef = useTemplateRef<InstanceType<typeof SearchDialog>>('searchDialog')

function openSearchDialog() {
  searchDialogRef.value?.open()
}
</script>

<template>
  <TopNavigationAction class="header-action--search" @click="openSearchDialog">
    <el-icon>
      <IconEpSearch />
    </el-icon>
    <span>{{ t('header.search') }}</span>
  </TopNavigationAction>

  <SearchDialog ref="searchDialog" />
</template>

<style scoped lang="scss">
.header-action--search {
  justify-content: flex-start;
  min-width: 110px;
}

@media (width <= 768px) {
  .header-action--search span {
    display: none;
  }

  .header-action--search {
    justify-content: center;
    min-width: 32px;
  }
}
</style>
