<script setup lang="ts">
import type { AdminSearchField, AdminSearchFormModel } from './types'
import { IconSearch as IconEpSearch } from '@iconify-prerendered/vue-ep'
import FormFieldRenderer from '@/shared/ui/form/FieldRenderer/index.vue'

defineOptions({ name: 'AdminSearchForm' })

const props = withDefaults(defineProps<{
  fields: AdminSearchField[]
  inline?: boolean
  labelWidth?: string
  labelSuffix?: string
  loading?: boolean
  disabled?: boolean
  searchText?: string
  resetText?: string
  showActions?: boolean
}>(), {
  inline: true,
  labelWidth: undefined,
  labelSuffix: '：',
  loading: false,
  disabled: false,
  searchText: undefined,
  resetText: undefined,
  showActions: true,
})

const emit = defineEmits<{
  search: []
  reset: []
}>()

const { t } = useI18n()
const resolvedSearchText = computed(() => props.searchText ?? t('common.search'))
const resolvedResetText = computed(() => props.resetText ?? t('common.reset'))
const model = defineModel<AdminSearchFormModel>('model', { required: true })
const visibleFields = computed(() => props.fields.filter(field => !field.showWhen || field.showWhen(model.value)))

function handleSearch() {
  emit('search')
}

function handleReset() {
  emit('reset')
}
</script>

<template>
  <el-form
    class="admin-search-form"
    :model="model"
    :inline="inline"
    :label-width="labelWidth"
    :disabled="disabled"
    @submit.prevent="handleSearch"
  >
    <TransitionGroup name="admin-search-field" tag="div" class="admin-search-form__content">
      <el-form-item
        v-for="field in visibleFields"
        :key="field.prop"
        :label="`${field.label}${labelSuffix}`"
        :prop="field.prop"
        class="admin-search-form__item"
      >
        <slot :name="`field-${field.prop}`" :field="field" :model="model">
          <FormFieldRenderer v-model="model[field.prop]" :field="field" />
        </slot>
      </el-form-item>

      <el-form-item v-if="showActions" key="__actions" class="admin-search-form__actions">
        <el-button
          type="primary"
          native-type="submit"
          :icon="IconEpSearch"
          :loading="loading"
        >
          {{ resolvedSearchText }}
        </el-button>
        <el-button :disabled="loading" @click="handleReset">
          {{ resolvedResetText }}
        </el-button>
      </el-form-item>
    </TransitionGroup>
  </el-form>
</template>

<style scoped lang="scss">
.admin-search-form {
  width: 100%;
}

.admin-search-form__content {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.admin-search-form__item {
  margin-right: 24px;
}

.admin-search-form__item :deep(.el-input),
.admin-search-form__item :deep(.el-input-number),
.admin-search-form__item :deep(.el-select),
.admin-search-form__item :deep(.el-date-editor) {
  width: var(--app-search-control-width);
}

.admin-search-form__actions {
  margin-right: 0;
}

.admin-search-field-enter-active,
.admin-search-field-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.admin-search-field-enter-from,
.admin-search-field-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.admin-search-field-leave-active {
  position: absolute;
}
</style>
