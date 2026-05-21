<script setup lang="ts">
defineOptions({ name: 'ErrorPage' })

defineProps<{
  code: string | number
  description: string
  showBack?: boolean
}>()

const emit = defineEmits<{
  home: []
  back: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="error-page">
    <div class="error-content">
      <h1 class="error-code" data-testid="error-code">
        {{ code }}
      </h1>
      <p class="error-desc" data-testid="error-desc">
        {{ description }}
      </p>
      <div class="error-actions">
        <el-button type="primary" data-testid="btn-home" @click="emit('home')">
          {{ t('error.backHome') }}
        </el-button>
        <el-button v-if="showBack" data-testid="btn-back" @click="emit('back')">
          {{ t('error.backPrev') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 40px 20px;
}

.error-content {
  text-align: center;
}

.error-code {
  margin: 0;
  font-size: clamp(80px, 15vw, 160px);
  font-weight: 800;
  line-height: 1;
  color: var(--el-color-primary);
  letter-spacing: -4px;
  user-select: none;
}

.error-desc {
  margin: 24px 0 32px;
  font-size: 18px;
  color: var(--el-text-color-secondary);
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
