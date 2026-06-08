<script setup lang="ts">
import type { MerchantApplication, MerchantApplicationLog } from '@/entities/merchant-onboarding'
import { StateMachineTimeline, StatusTag } from '@/shared/workflow'
import { merchantEventLabelMap, merchantStatusMap } from '../config/workflow'

defineOptions({ name: 'MerchantDetailDrawer' })

defineProps<{
  visible: boolean
  loading: boolean
  application: MerchantApplication | null
  logs: MerchantApplicationLog[]
  logsLoading: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

function handlePreviewMaterial(material: {
  type: string
  url: string
  name: string
}) {
  if (material.type === 'image') {
    // Element Plus 图片预览由模板中 el-image 处理
    return
  }
  // pdf 和 file 直接打开链接
  window.open(material.url, '_blank')
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    title="商家入驻申请详情"
    size="560px"
    @update:model-value="!$event && emit('close')"
  >
    <el-skeleton v-if="loading" :rows="8" animated />

    <template v-else-if="application">
      <!-- 基本信息 -->
      <el-descriptions :column="1" border>
        <el-descriptions-item label="商家名称">
          {{ application.merchantName }}
        </el-descriptions-item>
        <el-descriptions-item label="联系人">
          {{ application.contactName }}
        </el-descriptions-item>
        <el-descriptions-item label="联系电话">
          {{ application.contactPhone }}
        </el-descriptions-item>
        <el-descriptions-item label="经营品类">
          {{ application.businessCategory }}
        </el-descriptions-item>
        <el-descriptions-item label="经营地址">
          {{ application.address }}
        </el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <StatusTag
            :status="application.status"
            :status-map="merchantStatusMap"
          />
        </el-descriptions-item>
        <el-descriptions-item label="申请时间">
          {{ application.createdAt ? new Date(application.createdAt).toLocaleString('zh-CN') : '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 材料 -->
      <el-divider content-position="left">
        提交材料
      </el-divider>

      <div v-if="application.materials?.length" class="materials-grid">
        <div v-for="item in application.materials" :key="item.id" class="material-item">
          <template v-if="item.type === 'image'">
            <el-image
              :src="item.url"
              :preview-src-list="[item.url]"
              fit="cover"
              class="material-image"
            />
            <span class="material-name">{{ item.name }}</span>
          </template>
          <template v-else>
            <el-button link type="primary" @click="handlePreviewMaterial(item)">
              <el-icon><i-ep-document /></el-icon>
              {{ item.name }}
            </el-button>
          </template>
        </div>
      </div>
      <el-empty v-else description="暂无材料" :image-size="40" />

      <!-- 审核时间线 -->
      <el-divider content-position="left">
        审核记录
      </el-divider>

      <el-skeleton v-if="logsLoading" :rows="4" animated />
      <StateMachineTimeline
        v-else
        :entries="logs"
        :event-label-map="merchantEventLabelMap"
        :status-map="merchantStatusMap"
        show-transition
      />
    </template>
  </el-drawer>
</template>

<style scoped>
.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.material-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.material-image {
  width: 100px;
  height: 100px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.material-name {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
  word-break: break-all;
}
</style>
