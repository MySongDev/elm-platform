<script setup lang="ts">
import { DEFAULT_HOME_PATH } from '@/shared/config/paths'
import ErrorPage from './components/ErrorPage.vue'

defineOptions({ name: 'Page500' })

const router = useRouter()
const { t } = useI18n()

function goHome() {
  router.push(DEFAULT_HOME_PATH)
}
</script>

<template>
  <ErrorPage
    code="500"
    :description="t('error.serverError')"
    @home="goHome"
  />
</template>
