<script setup lang="ts">
import { transformI18n } from '@/shared/i18n'

defineOptions({ name: 'AppBreadcrumb' })

const route = useRoute()

const breadcrumbs = computed(() => {
  return route.matched
    .filter(item => item.meta?.title && !item.meta?.hidden)
    .map(item => ({
      title: transformI18n(item.meta.title),
      path: item.path,
    }))
})
</script>

<template>
  <el-breadcrumb separator="/">
    <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="item.path">
      <span v-if="index === breadcrumbs.length - 1" class="no-link">
        {{ item.title }}
      </span>
      <router-link v-else :to="item.path">
        {{ item.title }}
      </router-link>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<style scoped lang="scss">
.no-link {
  color: #97a8be;
  cursor: text;
}
</style>
