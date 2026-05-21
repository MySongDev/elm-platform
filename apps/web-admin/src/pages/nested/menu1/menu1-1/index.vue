<script setup lang="ts">
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

defineOptions({ name: 'NestedMenu11View' })

const { t } = useI18n()
</script>

<template>
  <AdminTablePage :title="t('route.menu11')">
    <el-empty :description="t('nested.demoPage', { name: t('route.menu11') })" />
  </AdminTablePage>
</template>
