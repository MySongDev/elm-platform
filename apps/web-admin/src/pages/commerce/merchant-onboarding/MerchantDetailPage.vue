<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/entities/session'
import { merchantOnboardingEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loading = ref(true)
const application = ref<MerchantApplication | null>(null)
const logs = ref<MerchantApplicationLog[]>([])

interface MerchantApplication {
  id: string
  merchantName: string
  contactName: string
  contactPhone: string
  businessCategory: string
  address: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  materials: {
    id: string
    name: string
    type: string
    url: string
  }[]
  createdAt: string
}

interface MerchantApplicationLog {
  id: string
  event: string
  fromStatus: string
  toStatus: string
  actorName: string
  reason?: string
  createdAt: string
}

function getId(): string {
  const id = route.params.id
  return Array.isArray(id) ? id[0] : id
}

async function fetchDetail() {
  loading.value = true
  try {
    const id = getId()
    application.value = await request.get(merchantOnboardingEndpoints.detail(id))
    logs.value = await request.get(merchantOnboardingEndpoints.actionLogs(id))
  }
  catch (e) {
    ElMessage.error('加载失败')
    router.back()
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchDetail)
watch(getId, fetchDetail)

function goBack() { router.back() }
function goReview(action: 'APPROVE' | 'REJECT') { router.push(`/commerce/merchant-onboarding/review/${getId()}?action=${action}`) }

const statusMap = {
  PENDING: {
    label: '待审核',
    type: 'warning',
  },
  APPROVED: {
    label: '已通过',
    type: 'success',
  },
  REJECTED: {
    label: '已驳回',
    type: 'danger',
  },
} as const
</script>

<template>
  <div v-if="authStore.hasPermission('merchant:onboarding:manage')" class="p-4">
    <el-button @click="goBack">
      返回
    </el-button>
    <el-divider />
    <el-skeleton v-if="loading" :rows="8" animated />
    <template v-else-if="application">
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
        <el-descriptions-item label="状态">
          <el-tag :type="statusMap[application.status]?.type">
            {{ statusMap[application.status]?.label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请时间">
          {{ application.createdAt ? new Date(application.createdAt).toLocaleString('zh-CN') : '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">
        提交材料
      </el-divider>
      <div v-if="application.materials?.length" class="flex gap-4 flex-wrap">
        <div v-for="m in application.materials" :key="m.id" class="text-center">
          <a :href="m.url" target="_blank" class="block">
            <el-image
              v-if="m.type === 'image'"
              :src="m.url"
              fit="cover"
              class="w-24 h-24 rounded border"
            />
            <el-icon v-else class="text-2xl text-gray-400"><i-ep-document /></el-icon>
            <span class="text-xs text-gray-500 truncate block w-24">{{ m.name }}</span>
          </a>
        </div>
      </div>
      <el-empty v-else description="暂无材料" :image-size="40" />

      <el-divider content-position="left">
        审核记录
      </el-divider>
      <el-table
        v-if="logs.length"
        :data="logs"
        border
        style="width:100%"
      >
        <el-table-column prop="event" label="操作" />
        <el-table-column prop="fromStatus" label="原状态" />
        <el-table-column prop="toStatus" label="新状态" />
        <el-table-column prop="actorName" label="操作人" />
        <el-table-column prop="reason" label="原因" />
        <el-table-column prop="createdAt" label="时间" :formatter="row => new Date(row.createdAt).toLocaleString('zh-CN')" />
      </el-table>
      <el-empty v-else description="暂无审核记录" />

      <div v-if="application.status === 'PENDING'" class="mt-4 flex gap-2">
        <el-button type="primary" @click="goReview('APPROVE')">
          通过
        </el-button>
        <el-button type="danger" @click="goReview('REJECT')">
          驳回
        </el-button>
      </div>
    </template>
  </div>
</template>
