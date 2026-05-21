<script setup lang="ts">
import { DEFAULT_HOME_PATH } from '@/shared/config/paths'
import ErrorPage from './components/ErrorPage.vue'

defineOptions({ name: 'Page403' })

const router = useRouter()
const { t } = useI18n()

function goHome() {
  router.push(DEFAULT_HOME_PATH)
}

function goBack() {
  router.back()
}
</script>

<template>
  <ErrorPage
    code="403"
    :description="t('error.noPermission')"
    show-back
    @home="goHome"
    @back="goBack"
  />
</template>
