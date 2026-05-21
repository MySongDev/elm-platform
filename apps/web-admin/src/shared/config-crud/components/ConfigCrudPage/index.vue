<script setup lang="ts">
import type { ConfigFormField, ConfigFormModel } from '../../model/form'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

defineOptions({ name: 'ConfigCrudPage' })

withDefaults(defineProps<{
  title: string
  loading?: boolean
  searchFields: ConfigFormField[]
  searchText?: string
  resetText?: string
}>(), {
  loading: false,
  searchText: undefined,
  resetText: undefined,
})

const emit = defineEmits<{
  refresh: []
  reset: []
}>()

const query = defineModel<ConfigFormModel>('query', { required: true })
</script>

<template>
  <div class="main">
    <AdminTablePage :title="title" :loading="loading" @refresh="emit('refresh')">
      <template #search>
        <AdminSearchForm v-model:model="query" :fields="searchFields" :search-text="searchText" :reset-text="resetText"
          @reset="emit('reset')" />
      </template>

      <template v-if="$slots.buttons" #buttons>
        <slot name="buttons" />
      </template>

      <slot />
    </AdminTablePage>

    <slot name="dialogs" />
  </div>
</template>
