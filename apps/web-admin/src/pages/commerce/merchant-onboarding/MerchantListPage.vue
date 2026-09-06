<script setup lang="ts">
import type { FormField } from '@/shared/ui/form/field-schema'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/entities/session'
import { merchantOnboardingEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'
import { Permissions } from '@/shared/config/access'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const list = ref<MerchantApplication[]>([])
const query = ref<MerchantQuery>({
  merchantName: '',
  status: '',
})

interface MerchantApplication {
  id: string
  merchantName: string
  contactName: string
  contactPhone: string
  businessCategory: string
  address: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

interface MerchantQuery {
  merchantName: string
  status: string
}

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

const statusOptions = computed(() => [
  {
    label: '全部',
    value: '',
  },
  ...Object.entries(statusMap).map(([v, { label }]) => ({
    label,
    value: v,
  })),
])

// 使用 FormField 类型，避免泛型不匹配
const searchFields = computed<FormField[]>(() => [
  {
    prop: 'merchantName',
    label: '商家名称',
    type: 'input',
    placeholder: '请输入商家名称',
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    placeholder: '全部状态',
    options: statusOptions.value,
  },
])

const tableColumns = [
  {
    prop: 'merchantName',
    label: '商家名称',
    minWidth: 140,
  },
  {
    prop: 'contactName',
    label: '联系人',
    width: 100,
  },
  {
    prop: 'contactPhone',
    label: '联系电话',
    minWidth: 130,
  },
  {
    prop: 'businessCategory',
    label: '经营品类',
    minWidth: 120,
  },
  {
    prop: 'address',
    label: '经营地址',
    minWidth: 160,
  },
  {
    label: '状态',
    width: 120,
    tag: (row: MerchantApplication) => statusMap[row.status] || {
      label: row.status,
      type: 'info',
    },
  },
  {
    label: '申请时间',
    minWidth: 180,
    formatter: (row: MerchantApplication) => row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN') : '-',
  },
]

async function fetchList() {
  loading.value = true
  try {
    list.value = await request.get(merchantOnboardingEndpoints.list, { params: query.value })
  }
  catch (e) {
    ElMessage.error('获取列表失败')
  }
  finally {
    loading.value = false
  }
}

function handleView(row: MerchantApplication) { router.push(`/commerce/merchant-onboarding/detail/${row.id}`) }
function handleReview(row: MerchantApplication, action: 'APPROVE' | 'REJECT') {
  router.push(`/commerce/merchant-onboarding/review/${row.id}?action=${action}`)
}

onMounted(fetchList)
</script>

<template>
  <AdminTablePage
    title="商家入驻审批"
    :loading="loading"
    :forbidden="!authStore.hasPermission(Permissions.MERCHANT_ONBOARDING_MANAGE)"
    @refresh="fetchList"
  >
    <template #search>
      <AdminSearchForm
        :fields="searchFields"
        :model="query"
        @search="fetchList"
        @reset="query = { merchantName: '', status: '' };fetchList()"
      />
    </template>
    <template #default>
      <el-table
        :data="list"
        :loading="loading"
        border
        style="width:100%"
      >
        <template v-for="col in tableColumns" :key="col.prop || col.label">
          <el-table-column v-bind="col" />
        </template>
        <el-table-column label="操作" fixed="right" min-width="180">
          <template #default="scope">
            <el-button size="small" link @click="handleView(scope.row as MerchantApplication)">
              查看
            </el-button>
            <el-button
              v-if="(scope.row as MerchantApplication).status === 'PENDING'"
              size="small"
              type="primary"
              link
              @click="handleReview(scope.row as MerchantApplication, 'APPROVE')"
            >
              通过
            </el-button>
            <el-button
              v-if="(scope.row as MerchantApplication).status === 'PENDING'"
              size="small"
              type="danger"
              link
              @click="handleReview(scope.row as MerchantApplication, 'REJECT')"
            >
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>
  </AdminTablePage>
</template>
