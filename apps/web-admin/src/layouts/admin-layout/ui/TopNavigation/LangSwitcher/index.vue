<script setup lang="ts">
import { useLocale } from '@/shared/i18n'
import HoverDropdown from '../components/HoverDropdown.vue'
import TopNavigationAction from '../components/TopNavigationAction.vue'

defineOptions({ name: 'LangSwitcher' })

const { locale, t } = useI18n()
const { setLocale } = useLocale()

const langOptions = [
  {
    label: '中文',
    value: 'zh-CN',
  },
  {
    label: 'English',
    value: 'en',
  },
]

function handleCommand(command: string | number | object) {
  if (typeof command === 'string')
    setLocale(command)
}
</script>

<template>
  <HoverDropdown @command="handleCommand">
    <TopNavigationAction shape="circle" :aria-label="t('header.language')">
      <el-icon :size="18">
        <SvgIcon icon-name="language" />
      </el-icon>
    </TopNavigationAction>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item in langOptions"
          :key="item.value"
          :command="item.value"
          :disabled="locale === item.value"
        >
          {{ item.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </HoverDropdown>
</template>
