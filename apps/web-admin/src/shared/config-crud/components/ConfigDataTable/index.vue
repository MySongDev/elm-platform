<script setup lang="ts" generic="Row extends object = object">
import type { ConfigDataTableOptions, ConfigTableColumn, ConfigTableDensity } from '../../model/table'
import { IconDownload as IconEpDownload, IconOperation as IconEpOperation } from '@iconify-prerendered/vue-ep'
import { buildCsvContent } from '../../model/csv'
import { DEFAULT_CONFIG_DATA_TABLE_OPTIONS } from '../../model/table'
import {
  getColumnPreferenceKey,
  getDefaultVisibleColumnKeys,
  mergeVisibleColumnKeys,
  parseStoredVisibleColumnKeys,
} from '../../model/table-preferences'
import ConfigTableColumns from './ConfigTableColumns.vue'

defineOptions({ name: 'ConfigDataTable' })

const props = defineProps<{
  loading: boolean
  data: Row[]
  columns: ConfigTableColumn<Row>[]
  table?: ConfigDataTableOptions<Row>
}>()

const emit = defineEmits<{
  batchAction: [actionKey: string, rows: Row[]]
}>()

const { t } = useI18n()
const selectedRows = shallowRef<Row[]>([])
const density = ref<ConfigTableDensity>('default')
const visibleColumnKeys = ref<string[]>([])

const tableOptions = computed<ConfigDataTableOptions<Row> & typeof DEFAULT_CONFIG_DATA_TABLE_OPTIONS>(() => ({
  ...DEFAULT_CONFIG_DATA_TABLE_OPTIONS,
  ...props.table,
}))

const isSelectionEnabled = computed(() => Boolean(tableOptions.value.selection))
const isColumnSettingsEnabled = computed(() => Boolean(tableOptions.value.preferencesKey))
const isDensityEnabled = computed(() => tableOptions.value.density !== undefined)
const isExportEnabled = computed(() => Boolean(tableOptions.value.exportable))
const hasBatchActions = computed(() => Boolean(tableOptions.value.batchActions?.length))
const hasToolbar = computed(() => isColumnSettingsEnabled.value || isDensityEnabled.value || isExportEnabled.value || hasBatchActions.value)

const densitySize = computed(() => {
  if (density.value === 'compact')
    return 'small'
  if (density.value === 'comfortable')
    return 'large'
  return 'default'
})

const columnOptions = computed(() => props.columns.map((column, index) => ({
  column,
  key: getColumnPreferenceKey(column, index),
  disabled: column.hideable === false,
})))

const visibleColumns = computed(() => props.columns.filter((column, index) => visibleColumnKeys.value.includes(getColumnPreferenceKey(column, index))))

const selectedCount = computed(() => selectedRows.value.length)

function loadVisibleColumnKeys() {
  if (!tableOptions.value.preferencesKey) {
    visibleColumnKeys.value = getDefaultVisibleColumnKeys(props.columns)
    return
  }

  const storedKeys = parseStoredVisibleColumnKeys(localStorage.getItem(tableOptions.value.preferencesKey))
  visibleColumnKeys.value = mergeVisibleColumnKeys(props.columns, storedKeys)
}

function persistVisibleColumnKeys() {
  if (!tableOptions.value.preferencesKey)
    return
  localStorage.setItem(tableOptions.value.preferencesKey, JSON.stringify(visibleColumnKeys.value))
}

function handleSelectionChange(rows: Row[]) {
  selectedRows.value = rows
}

function handleColumnCheckChange() {
  visibleColumnKeys.value = mergeVisibleColumnKeys(props.columns, visibleColumnKeys.value)
  persistVisibleColumnKeys()
}

function resetColumns() {
  visibleColumnKeys.value = getDefaultVisibleColumnKeys(props.columns)
  persistVisibleColumnKeys()
}

function handleBatchAction(actionKey: string) {
  emit('batchAction', actionKey, selectedRows.value)
}

function downloadCsv(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function exportCsv() {
  const content = buildCsvContent(visibleColumns.value, props.data)
  downloadCsv(content, tableOptions.value.exportFileName ?? 'table-export.csv')
}

watch(() => props.columns, loadVisibleColumnKeys, {
  immediate: true,
  deep: true,
})

watch(() => tableOptions.value.density, (value) => {
  density.value = value ?? 'default'
}, {
  immediate: true,
})
</script>

<template>
  <div class="config-data-table">
    <div v-if="hasToolbar" class="config-data-table__toolbar">
      <div class="config-data-table__batch-actions">
        <span v-if="isSelectionEnabled" class="config-data-table__selection-count">
          {{ t('tableEnhance.selectedCount', { count: selectedCount }) }}
        </span>
        <el-button
          v-for="action in tableOptions.batchActions"
          :key="action.key"
          v-auth="action.auth"
          :type="action.type"
          :disabled="selectedCount === 0 || action.disabled?.(selectedRows)"
          @click="handleBatchAction(action.key)"
        >
          {{ action.text }}
        </el-button>
      </div>

      <div class="config-data-table__tools">
        <el-select
          v-if="isDensityEnabled"
          v-model="density"
          class="config-data-table__density"
          :aria-label="t('tableEnhance.density')"
        >
          <el-option :label="t('tableEnhance.densityDefault')" value="default" />
          <el-option :label="t('tableEnhance.densityComfortable')" value="comfortable" />
          <el-option :label="t('tableEnhance.densityCompact')" value="compact" />
        </el-select>

        <el-popover v-if="isColumnSettingsEnabled" trigger="click" width="220">
          <template #reference>
            <el-button :icon="IconEpOperation">
              {{ t('tableEnhance.columnSettings') }}
            </el-button>
          </template>

          <div class="config-data-table__column-settings">
            <el-checkbox-group v-model="visibleColumnKeys" @change="handleColumnCheckChange">
              <el-checkbox
                v-for="option in columnOptions"
                :key="option.key"
                :label="option.key"
                :disabled="option.disabled"
              >
                {{ option.column.label }}
              </el-checkbox>
            </el-checkbox-group>
            <el-button link type="primary" @click="resetColumns">
              {{ t('tableEnhance.resetColumns') }}
            </el-button>
          </div>
        </el-popover>

        <el-button v-if="isExportEnabled" :icon="IconEpDownload" @click="exportCsv">
          {{ t('tableEnhance.exportCsv') }}
        </el-button>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="data"
      :row-key="tableOptions.rowKey"
      :border="tableOptions.border"
      :stripe="tableOptions.stripe"
      :default-expand-all="tableOptions.defaultExpandAll"
      :size="densitySize"
      @selection-change="handleSelectionChange"
    >
      <el-table-column v-if="isSelectionEnabled" type="selection" width="48" />
      <ConfigTableColumns :columns="visibleColumns" />
      <slot />
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.config-data-table {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-md);
}

.config-data-table__toolbar {
  display: flex;
  gap: var(--app-space-md);
  align-items: center;
  justify-content: space-between;
}

.config-data-table__batch-actions,
.config-data-table__tools {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.config-data-table__selection-count {
  font-size: 13px;
  color: var(--app-text-secondary);
}

.config-data-table__density {
  width: 112px;
}

.config-data-table__column-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
