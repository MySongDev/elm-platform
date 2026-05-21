<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/entities/session'
import { transformI18n } from '@/shared/i18n'
import { activePaneKey } from '../config'

defineOptions({ name: 'AccountManagement' })

const authStore = useAuthStore()
const { t } = useI18n()
const activePaneInfo = inject(activePaneKey)
const sectionTitle = computed(() => activePaneInfo?.value ? transformI18n(activePaneInfo.value.label) : '')

const list = computed(() => [
  {
    title: t('accountManagement.password'),
    illustrate: t('accountManagement.passwordStrength'),
    button: t('common.edit'),
  },
  {
    title: t('accountManagement.phone'),
    illustrate: authStore.userInfo?.phone
      ? t('accountManagement.phoneBound', { phone: authStore.userInfo.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') })
      : t('accountManagement.phoneUnbound'),
    button: authStore.userInfo?.phone ? t('common.edit') : t('common.bind'),
  },
  {
    title: t('accountManagement.securityQuestion'),
    illustrate: t('accountManagement.securityQuestionDesc'),
    button: t('common.set'),
  },
  {
    title: t('accountManagement.backupEmail'),
    illustrate: authStore.userInfo?.email
      ? t('accountManagement.emailBound', { email: authStore.userInfo.email.replace(/(.{2}).+(@.+)/, '$1***$2') })
      : t('accountManagement.emailUnbound'),
    button: authStore.userInfo?.email ? t('common.edit') : t('common.bind'),
  },
])

function onClick() {
  ElMessage.info(t('accountManagement.implementHint'))
}
</script>

<template>
  <div class="account-management-section">
    <h3 class="section-title">
      {{ sectionTitle }}
    </h3>
    <template v-for="(item, index) in list" :key="index">
      <div class="management-item">
        <div class="management-item__content">
          <p class="management-item__title">
            {{ item.title }}
          </p>
          <el-text type="info">
            {{ item.illustrate }}
          </el-text>
        </div>
        <el-button type="primary" text @click="onClick">
          {{ item.button }}
        </el-button>
      </div>
      <el-divider v-if="index < list.length - 1" />
    </template>
  </div>
</template>

<style scoped lang="scss">
.account-management-section {
  min-width: 45%;
  max-width: 70%;
}

.section-title {
  margin: 32px 0;
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
}

.management-item {
  display: flex;
  align-items: center;

  &__content {
    flex: 1;
  }

  &__title {
    margin-bottom: 4px;
    font-size: 15px;
    font-weight: 500;
    color: $text-primary;
  }
}

.el-divider--horizontal {
  border-top: 0.1px solid $border-light;
}
</style>
