# Order Management Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 管理端订单管理读取真实支付订单状态，用户端待支付订单支持复用原订单号继续支付。

**Architecture:** 后端 `PaymentService` 继续作为 `payment_orders` 的唯一支付状态边界，新增管理端只读列表与 resume 支付 URL 能力。管理端订单页改为只读真实支付订单表格；用户端订单页在 `PENDING` 订单上先刷新状态再继续支付。

**Tech Stack:** NestJS 10、Prisma、Jest、Vue 3、TypeScript、Vant、Element Plus、Vitest、pnpm workspace。

---

## File Structure

- Modify: `apps/server/src/modules/payment/payment.service.ts` — 增加 `listAdminOrders()` 与 `resumeAlipayWapPayment()`，复用现有订单摘要转换。
- Modify: `apps/server/src/modules/payment/payment.controller.ts` — 增加用户端 resume 接口。
- Create: `apps/server/src/modules/payment/dto/resume-alipay-wap-payment.dto.ts` — resume 入参 DTO。
- Modify: `apps/server/src/modules/elm/controllers/elm-admin.controller.ts` — 管理端订单列表改读 `PaymentService`，移除状态更新端点或让页面不再使用它。
- Modify: `apps/server/src/modules/elm/elm.module.ts` — 确保 `ElmAdminController` 能注入 `PaymentService`；若 `PaymentModule` 未导出服务，则同步调整。
- Modify: `apps/server/src/modules/payment/payment.service.spec.ts` — 覆盖 resume 与管理端列表摘要。
- Modify: `apps/web-admin/src/entities/order/model/types.ts` — 改为真实支付订单类型。
- Modify: `apps/web-admin/src/entities/order/api/index.ts` — 改读真实支付订单接口，删除更新状态调用。
- Modify: `apps/web-admin/src/features/order-management/model/useOrderManagement.ts` — 只保留列表、查询和刷新状态，不再维护状态编辑弹窗。
- Modify: `apps/web-admin/src/features/order-management/config/fields.ts` — 状态枚举改为 `PENDING/PAID/CLOSED`，表格字段改为真实支付订单字段。
- Modify: `apps/web-admin/src/features/order-management/ui/OrderTable.vue` — 删除编辑状态操作列。
- Modify: `apps/web-admin/src/features/order-management/index.ts` — 移除状态弹窗相关导出。
- Modify: `apps/web-admin/src/pages/commerce/order/index.vue` — 删除状态弹窗接入。
- Modify: `apps/web-user/src/services/api/endpoints/payment.endpoints.js` — 增加 resume endpoint。
- Modify: `apps/web-user/src/services/api/api-payment.js` — 增加 `resumeAlipayWapPayment()`。
- Modify: `apps/web-user/src/views/order/components/OrderCard.vue` — `PENDING` 订单显示继续支付按钮并 emit 事件。
- Modify: `apps/web-user/src/views/order/order.vue` — 实现点击继续支付流程。
- Create: `apps/web-user/src/views/order/components/OrderCard.test.js` — 验证按钮显示与事件。

---

### Task 1: Backend resume DTO and service tests

**Files:**
- Create: `apps/server/src/modules/payment/dto/resume-alipay-wap-payment.dto.ts`
- Modify: `apps/server/src/modules/payment/payment.service.spec.ts`

- [ ] **Step 1: Create resume DTO**

Create `apps/server/src/modules/payment/dto/resume-alipay-wap-payment.dto.ts`:

```ts
import { IsString } from 'class-validator'

export class ResumeAlipayWapPaymentDto {
  @IsString()
  orderNo!: string

  @IsString()
  userId!: string
}
```

- [ ] **Step 2: Add failing service tests**

Append these tests inside `describe('PaymentService', () => { ... })` in `apps/server/src/modules/payment/payment.service.spec.ts`:

```ts
it('lists payment orders for admin with summary fields', async () => {
  const { service, prisma } = createService()

  const result = await service.listAdminOrders()

  expect(prisma.paymentOrder.findMany).toHaveBeenCalledWith({
    orderBy: [{ paidAt: 'desc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  })
  expect(result).toEqual([
    expect.objectContaining({
      id: 1,
      orderNo: 'ELMALI202605231234560001',
      userId: '1',
      shopName: '示例商家',
      status: 'PENDING',
      tradeStatus: 'WAIT_BUYER_PAY',
      payableAmount: 29,
      goodsAmount: 24,
      deliveryFee: 5,
      totalQty: 2,
    }),
  ])
})

it('resumes a pending Alipay WAP payment with the original order number', async () => {
  const { service, alipay } = createService()

  const result = await service.resumeAlipayWapPayment({
    orderNo: 'ELMALI202605231234560001',
    userId: '1',
  })

  expect(alipay.createWapPayUrl).toHaveBeenCalledWith({
    orderNo: 'ELMALI202605231234560001',
    payableAmount: 29,
    subject: '示例商家 外卖订单',
  })
  expect(result).toEqual({
    orderNo: 'ELMALI202605231234560001',
    payUrl: expect.stringContaining('alipay.trade.wap.pay'),
    payableAmount: 29,
  })
})

it('rejects resume when the order belongs to another user', async () => {
  const { service } = createService()

  await expect(service.resumeAlipayWapPayment({
    orderNo: 'ELMALI202605231234560001',
    userId: '2',
  })).rejects.toThrow(UnauthorizedException)
})

it('rejects resume when the order is paid', async () => {
  const { service, prisma } = createService()
  prisma.paymentOrder.findUnique.mockResolvedValue(createOrder({ status: 'PAID' }))

  await expect(service.resumeAlipayWapPayment({
    orderNo: 'ELMALI202605231234560001',
    userId: '1',
  })).rejects.toThrow(BadRequestException)
})

it('rejects resume when the order is closed', async () => {
  const { service, prisma } = createService()
  prisma.paymentOrder.findUnique.mockResolvedValue(createOrder({ status: 'CLOSED' }))

  await expect(service.resumeAlipayWapPayment({
    orderNo: 'ELMALI202605231234560001',
    userId: '1',
  })).rejects.toThrow(BadRequestException)
})
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
pnpm --filter vue3-elm-node run test -- payment.service.spec.ts
```

Expected: FAIL because `listAdminOrders` and `resumeAlipayWapPayment` are not implemented.

- [ ] **Step 4: Commit tests and DTO**

```bash
git add apps/server/src/modules/payment/dto/resume-alipay-wap-payment.dto.ts apps/server/src/modules/payment/payment.service.spec.ts
git commit -m "test: cover payment order resume behavior"
```

---

### Task 2: Backend PaymentService implementation

**Files:**
- Modify: `apps/server/src/modules/payment/payment.service.ts`

- [ ] **Step 1: Import DTO type**

At the top of `apps/server/src/modules/payment/payment.service.ts`, add:

```ts
import { ResumeAlipayWapPaymentDto } from './dto/resume-alipay-wap-payment.dto'
```

- [ ] **Step 2: Implement admin list and resume methods**

Inside `PaymentService`, add these public methods after `listOrders()`:

```ts
  async listAdminOrders(limit?: unknown) {
    const take = Number.parseInt(String(limit || ''), 10);
    const orders = await (this.prisma as any).paymentOrder.findMany({
      orderBy: [{ paidAt: 'desc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: Number.isFinite(take) && take > 0 ? take : 100,
    });

    return orders.map((order: PaymentOrderRecord) => this.toOrderSummary(order));
  }

  async resumeAlipayWapPayment(payload: ResumeAlipayWapPaymentDto) {
    const order = await this.findOrder(payload.orderNo);

    if (String(order.userId) !== String(payload.userId)) {
      throw new UnauthorizedException('无权继续支付该订单');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('当前订单状态不可继续支付');
    }

    const payUrl = this.alipay.createWapPayUrl({
      orderNo: order.orderNo,
      payableAmount: toPrice(order.payableAmount),
      subject: order.subject || `${order.shopName} 外卖订单`,
    });

    return {
      orderNo: order.orderNo,
      payUrl,
      payableAmount: toPrice(order.payableAmount),
    };
  }
```

- [ ] **Step 3: Run backend payment tests**

Run:

```bash
pnpm --filter vue3-elm-node run test -- payment.service.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Commit implementation**

```bash
git add apps/server/src/modules/payment/payment.service.ts
git commit -m "feat: resume pending payment orders"
```

---

### Task 3: Backend controller endpoints

**Files:**
- Modify: `apps/server/src/modules/payment/payment.controller.ts`
- Modify: `apps/server/src/modules/elm/controllers/elm-admin.controller.ts`
- Modify: `apps/server/src/modules/elm/elm.module.ts`

- [ ] **Step 1: Add resume endpoint to payment controller**

In `apps/server/src/modules/payment/payment.controller.ts`, import DTO:

```ts
import { ResumeAlipayWapPaymentDto } from './dto/resume-alipay-wap-payment.dto'
```

Add this method after `createAlipayWapPayment()`:

```ts
  @Post('payments/alipay/wap/resume')
  @ApiOperation({ summary: '继续支付宝 WAP 支付单' })
  resumeAlipayWapPayment(@Body() dto: ResumeAlipayWapPaymentDto) {
    return rawResponse(this.paymentService.resumeAlipayWapPayment(dto));
  }
```

- [ ] **Step 2: Inject PaymentService into admin controller**

In `apps/server/src/modules/elm/controllers/elm-admin.controller.ts`, add import:

```ts
import { PaymentService } from '../../payment/payment.service'
```

Change constructor to include payment service:

```ts
  constructor(
    private readonly restaurantService: ElmRestaurantService,
    private readonly foodService: ElmFoodService,
    private readonly orderService: ElmOrderService,
    private readonly paymentService: PaymentService,
  ) {}
```

Change `getOrders()` to return true payment orders:

```ts
  @Get('orders')
  @Roles('admin')
  @ApiOperation({ summary: '管理端真实支付订单列表' })
  getOrders() {
    return this.paymentService.listAdminOrders();
  }
```

Leave `PATCH admin/commerce/orders/:id` in place for compatibility, but the admin UI will stop calling it.

- [ ] **Step 3: Ensure module dependency is wired**

Open `apps/server/src/modules/elm/elm.module.ts`. If it does not import `PaymentModule`, add it:

```ts
import { PaymentModule } from '../payment/payment.module'
```

Ensure the module imports include it:

```ts
@Module({
  imports: [PaymentModule],
  controllers: [
    ElmAdminController,
    ElmOrderPublicController,
    // keep existing controllers here
  ],
  providers: [
    // keep existing providers here
  ],
})
export class ElmModule {}
```

If `PaymentModule` does not export `PaymentService`, update `apps/server/src/modules/payment/payment.module.ts`:

```ts
@Module({
  imports: [PrismaModule],
  controllers: [PaymentController],
  providers: [PaymentService, AlipayService],
  exports: [PaymentService],
})
export class PaymentModule {}
```

- [ ] **Step 4: Run backend tests/build**

Run:

```bash
pnpm --filter vue3-elm-node run test -- payment.service.spec.ts
pnpm --filter vue3-elm-node run build
```

Expected: both PASS.

- [ ] **Step 5: Commit controller wiring**

```bash
git add apps/server/src/modules/payment/payment.controller.ts apps/server/src/modules/elm/controllers/elm-admin.controller.ts apps/server/src/modules/elm/elm.module.ts apps/server/src/modules/payment/payment.module.ts
git commit -m "feat: expose real payment orders to admin"
```

---

### Task 4: Admin order types, API, and state

**Files:**
- Modify: `apps/web-admin/src/entities/order/model/types.ts`
- Modify: `apps/web-admin/src/entities/order/api/index.ts`
- Modify: `apps/web-admin/src/features/order-management/model/useOrderManagement.ts`

- [ ] **Step 1: Replace order type**

Replace `apps/web-admin/src/entities/order/model/types.ts` with:

```ts
export type PaymentOrderStatus = 'PENDING' | 'PAID' | 'CLOSED'

export interface OrderItem {
  id: number
  orderNo: string
  userId: string
  shopId: string | null
  shopName: string
  status: PaymentOrderStatus | string
  tradeStatus: string
  tradeNo: string | null
  payableAmount: number
  goodsAmount: number
  deliveryFee: number
  cartItems: unknown[]
  totalQty: number
  paidAt: string | null
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: Remove update API**

Replace `apps/web-admin/src/entities/order/api/index.ts` with:

```ts
import type { OrderItem } from '../model'
import { adminEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

export function getCommerceOrders() {
  return request.get<OrderItem[]>(adminEndpoints.commerce.orders)
}
```

- [ ] **Step 3: Simplify order management state**

Replace `apps/web-admin/src/features/order-management/model/useOrderManagement.ts` with:

```ts
import type { OrderItem } from '@/entities/order'
import { getCommerceOrders } from '@/entities/order'
import { createElementPlusCrudFeedback, useReadonlyTable } from '@/shared/config-crud'

export interface OrderQuery {
  orderNo: string
  status: '' | OrderItem['status']
}

export function getOrderStatusType(status: OrderItem['status']) {
  if (status === 'PAID')
    return 'success'
  if (status === 'CLOSED')
    return 'info'
  if (status === 'PENDING')
    return 'warning'
  return 'info'
}

export function useOrderManagement() {
  const table = useReadonlyTable<OrderItem, OrderQuery>({
    getDefaultQuery: () => ({ orderNo: '', status: '' }),
    fetchList: () => getCommerceOrders(),
    filterItem: (item, query) => {
      const orderNoMatched = !query.orderNo || item.orderNo.includes(query.orderNo)
      const statusMatched = !query.status || item.status === query.status
      return orderNoMatched && statusMatched
    },
    feedback: createElementPlusCrudFeedback(),
  })

  return {
    loading: table.loading,
    query: table.query,
    filteredData: table.filteredData,
    resetQuery: table.resetQuery,
    fetchRows: table.fetchRows,
  }
}
```

If `useReadonlyTable` is not exported from `@/shared/config-crud`, import it from its actual path:

```ts
import { useReadonlyTable } from '@/shared/lib/useReadonlyTable'
```

- [ ] **Step 4: Run admin type-check to expose integration issues**

Run:

```bash
pnpm --filter elm-web-admin run type-check
```

Expected: FAIL only in files that still reference removed status editing fields.

- [ ] **Step 5: Commit state layer**

```bash
git add apps/web-admin/src/entities/order/model/types.ts apps/web-admin/src/entities/order/api/index.ts apps/web-admin/src/features/order-management/model/useOrderManagement.ts
git commit -m "feat: read real payment orders in admin state"
```

---

### Task 5: Admin table and page UI

**Files:**
- Modify: `apps/web-admin/src/features/order-management/config/fields.ts`
- Modify: `apps/web-admin/src/features/order-management/ui/OrderTable.vue`
- Modify: `apps/web-admin/src/features/order-management/index.ts`
- Modify: `apps/web-admin/src/pages/commerce/order/index.vue`

- [ ] **Step 1: Update fields**

In `apps/web-admin/src/features/order-management/config/fields.ts`, replace status options and table columns with:

```ts
function createOrderStatusOptions(t: Translate) {
  return [
    { label: t('commerce.order.pending'), value: 'PENDING' },
    { label: t('commerce.order.paid'), value: 'PAID' },
    { label: t('commerce.order.closed'), value: 'CLOSED' },
  ]
}

export function createOrderSearchFields(t: Translate) {
  return [
    { prop: 'orderNo', label: t('commerce.order.orderNo'), type: 'input', placeholder: t('commerce.order.orderNoPlaceholder') },
    { prop: 'status', label: t('commerce.order.status'), type: 'select', placeholder: t('commerce.order.statusPlaceholder'), options: createOrderStatusOptions(t) },
  ] satisfies ConfigFormField[]
}

export function createOrderTableColumns(t: Translate) {
  return [
    { prop: 'orderNo', label: t('commerce.order.orderNo'), minWidth: 190 },
    { prop: 'shopName', label: t('commerce.order.restaurant'), minWidth: 160 },
    { prop: 'userId', label: t('commerce.order.userId'), width: 110 },
    { label: t('commerce.order.amount'), width: 110, formatter: row => `¥${Number(row.payableAmount || 0).toFixed(2)}` },
    { label: t('commerce.order.status'), width: 110, tag: row => ({ label: row.status, type: getOrderStatusType(row.status) }) },
    { prop: 'tradeStatus', label: '支付宝状态', minWidth: 150 },
    { label: '支付时间', minWidth: 180, formatter: row => row.paidAt ? formatDateTime(row.paidAt) : '-' },
    { label: t('commerce.order.createdAt'), minWidth: 180, formatter: row => formatDateTime(row.createdAt) },
  ] satisfies ConfigTableColumn<OrderItem>[]
}
```

Remove `createOrderStatusFields` export from this file.

- [ ] **Step 2: Make table read-only**

Replace `apps/web-admin/src/features/order-management/ui/OrderTable.vue` script/template with:

```vue
<script setup lang="ts">
import type { OrderItem } from '@/entities/order'
import { ConfigDataTable } from '@/shared/config-crud'
import { createOrderTableColumns } from '../config/fields'

defineOptions({ name: 'OrderTable' })

defineProps<{
  loading: boolean
  data: OrderItem[]
}>()

const { t } = useI18n()
const columns = computed(() => createOrderTableColumns(t))
</script>

<template>
  <ConfigDataTable :loading="loading" :data="data" :columns="columns" />
</template>
```

- [ ] **Step 3: Update exports**

Replace `apps/web-admin/src/features/order-management/index.ts` with:

```ts
export {
  createOrderSearchFields,
  createOrderTableColumns,
} from './config/fields'
export {
  getOrderStatusType,
  useOrderManagement,
} from './model/useOrderManagement'
export type {
  OrderQuery,
} from './model/useOrderManagement'
export { default as OrderTable } from './ui/OrderTable.vue'
```

- [ ] **Step 4: Remove dialog from page**

Replace `apps/web-admin/src/pages/commerce/order/index.vue` with:

```vue
<script setup lang="ts">
import {
  createOrderSearchFields,
  OrderTable,
  useOrderManagement,
} from '@/features/order-management'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

defineOptions({ name: 'CommerceOrderView' })

const { t } = useI18n()
const searchFields = computed(() => createOrderSearchFields(t))
const {
  loading,
  query,
  filteredData,
  resetQuery,
  fetchRows,
} = useOrderManagement()

onMounted(fetchRows)
</script>

<template>
  <div class="main">
    <AdminTablePage :title="t('commerce.order.title')" :loading="loading" @refresh="fetchRows">
      <template #search>
        <AdminSearchForm v-model:model="query" :fields="searchFields" @reset="resetQuery" />
      </template>

      <OrderTable :loading="loading" :data="filteredData" />
    </AdminTablePage>
  </div>
</template>
```

- [ ] **Step 5: Run admin type-check**

Run:

```bash
pnpm --filter elm-web-admin run type-check
```

Expected: PASS.

- [ ] **Step 6: Commit admin UI**

```bash
git add apps/web-admin/src/features/order-management/config/fields.ts apps/web-admin/src/features/order-management/ui/OrderTable.vue apps/web-admin/src/features/order-management/index.ts apps/web-admin/src/pages/commerce/order/index.vue
git commit -m "feat: show payment orders read-only in admin"
```

---

### Task 6: User payment API resume method

**Files:**
- Modify: `apps/web-user/src/services/api/endpoints/payment.endpoints.js`
- Modify: `apps/web-user/src/services/api/api-payment.js`

- [ ] **Step 1: Add endpoint**

Update `apps/web-user/src/services/api/endpoints/payment.endpoints.js`:

```js
export const paymentEndpoints = {
  createAlipayWap: '/payments/alipay/wap/create',
  resumeAlipayWap: '/payments/alipay/wap/resume',
  alipayStatus: orderNo => `/payments/alipay/status/${orderNo}`,
  orders: '/orders',
}
```

- [ ] **Step 2: Add API function**

Append to `apps/web-user/src/services/api/api-payment.js` after `createAlipayWapPayment()`:

```js
export async function resumeAlipayWapPayment(payload) {
  const response = await paymentRequest.post(paymentEndpoints.resumeAlipayWap, payload)
  return unwrapResponse(response)
}
```

- [ ] **Step 3: Run existing user tests**

Run:

```bash
pnpm --filter vue3-elm-js run test -- src/services/http/policies.test.js
```

Expected: PASS.

- [ ] **Step 4: Commit API change**

```bash
git add apps/web-user/src/services/api/endpoints/payment.endpoints.js apps/web-user/src/services/api/api-payment.js
git commit -m "feat: add user payment resume api"
```

---

### Task 7: User order card continue payment UI

**Files:**
- Modify: `apps/web-user/src/views/order/components/OrderCard.vue`
- Create: `apps/web-user/src/views/order/components/OrderCard.test.js`

- [ ] **Step 1: Add failing component test**

Create `apps/web-user/src/views/order/components/OrderCard.test.js`:

```js
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import OrderCard from './OrderCard.vue'

function createOrder(overrides = {}) {
  return {
    orderNo: 'ELMALI202605241200000001',
    shopName: '示例商家',
    status: 'PENDING',
    tradeStatus: 'WAIT_BUYER_PAY',
    payableAmount: 29,
    totalQty: 2,
    createdAt: '2026-05-24T12:00:00.000Z',
    updatedAt: '2026-05-24T12:00:00.000Z',
    paidAt: null,
    ...overrides,
  }
}

describe('OrderCard', () => {
  it('shows continue payment action for pending orders', () => {
    const wrapper = mount(OrderCard, {
      props: {
        order: createOrder(),
      },
    })

    expect(wrapper.text()).toContain('继续支付')
  })

  it('emits continue-payment when clicking pending order action', async () => {
    const order = createOrder()
    const wrapper = mount(OrderCard, {
      props: { order },
    })

    await wrapper.get('[data-test="continue-payment"]').trigger('click')

    expect(wrapper.emitted('continue-payment')).toEqual([[order]])
  })

  it('does not show continue payment action for paid orders', () => {
    const wrapper = mount(OrderCard, {
      props: {
        order: createOrder({ status: 'PAID' }),
      },
    })

    expect(wrapper.text()).not.toContain('继续支付')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter vue3-elm-js exec vitest run src/views/order/components/OrderCard.test.js
```

Expected: FAIL because button is not implemented.

- [ ] **Step 3: Implement card action**

In `apps/web-user/src/views/order/components/OrderCard.vue`, add emits and computed state after props:

```js
const emit = defineEmits({
  'continue-payment': order => Boolean(order?.orderNo),
})

const canContinuePayment = computed(() => props.order.status === 'PENDING')
```

In the template, after `.meta-list`, add:

```vue
<button
  v-if="canContinuePayment"
  class="continue-button"
  data-test="continue-payment"
  type="button"
  @click="emit('continue-payment', order)"
>
  继续支付
</button>
```

Add CSS before `</style>`:

```scss
.continue-button {
  flex: 0 0 auto;
  height: 32px;
  border: 0;
  border-radius: 16px;
  padding: 0 14px;
  background: #19be6b;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}
```

- [ ] **Step 4: Run component test**

Run:

```bash
pnpm --filter vue3-elm-js exec vitest run src/views/order/components/OrderCard.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit card UI**

```bash
git add apps/web-user/src/views/order/components/OrderCard.vue apps/web-user/src/views/order/components/OrderCard.test.js
git commit -m "feat: show continue payment on pending orders"
```

---

### Task 8: User order page continue payment flow

**Files:**
- Modify: `apps/web-user/src/views/order/order.vue`

- [ ] **Step 1: Import APIs and alert**

In `apps/web-user/src/views/order/order.vue`, add imports:

```js
import { showAlert } from '@/components/common/AlterTip'
import { getAlipayPaymentStatus, resumeAlipayWapPayment } from '@/services/api/api-payment'
```

Change Vue import to include `ref`:

```js
import { computed, onActivated, ref, watch } from 'vue'
```

- [ ] **Step 2: Add loading state and handler**

After `highlightedOrderNo`, add:

```js
const continuingOrderNo = ref('')
```

Add handler before lifecycle hooks:

```js
async function continuePayment(order) {
  if (!currentUserId.value) {
    goLogin()
    return
  }

  if (!order?.orderNo || continuingOrderNo.value)
    return

  continuingOrderNo.value = order.orderNo

  try {
    const latest = await getAlipayPaymentStatus(order.orderNo, true)

    if (latest?.status === 'PAID') {
      showAlert('订单已支付')
      await fetchOrders()
      return
    }

    if (latest?.status === 'CLOSED') {
      showAlert('订单已关闭，请重新下单')
      await fetchOrders()
      return
    }

    if (latest?.status !== 'PENDING') {
      showAlert('当前订单状态不可继续支付')
      await fetchOrders()
      return
    }

    const { payUrl } = await resumeAlipayWapPayment({
      orderNo: order.orderNo,
      userId: currentUserId.value,
    })

    window.location.href = payUrl
  }
  catch (err) {
    showAlert(err?.message || '继续支付失败，请稍后再试')
  }
  finally {
    continuingOrderNo.value = ''
  }
}
```

- [ ] **Step 3: Wire event in template**

Update `OrderCard` usage:

```vue
<OrderCard
  v-for="order in orders"
  :key="order.orderNo"
  :order="order"
  :highlight="order.orderNo === highlightedOrderNo"
  @continue-payment="continuePayment"
/>
```

- [ ] **Step 4: Run user build/type check**

Run:

```bash
pnpm --filter vue3-elm-js run type-check
pnpm --filter vue3-elm-js exec vitest run src/views/order/components/OrderCard.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit page flow**

```bash
git add apps/web-user/src/views/order/order.vue
git commit -m "feat: resume pending orders from user page"
```

---

### Task 9: Final validation

**Files:**
- No source edits unless validation fails.

- [ ] **Step 1: Run focused backend tests**

```bash
pnpm --filter vue3-elm-node run test -- payment.service.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run admin validation**

```bash
pnpm --filter elm-web-admin run type-check
```

Expected: PASS.

- [ ] **Step 3: Run user validation**

```bash
pnpm --filter vue3-elm-js exec vitest run src/views/order/components/OrderCard.test.js
pnpm --filter vue3-elm-js run type-check
```

Expected: PASS.

- [ ] **Step 4: Manual UI verification**

Start services:

```bash
pnpm dev:server
pnpm dev:admin
pnpm dev:user
```

Verify in browser:

1. Create a user-side payment order but do not complete payment.
2. Open user order page and confirm the order shows `待支付` plus “继续支付”.
3. Click “继续支付” and confirm it redirects to an Alipay WAP URL.
4. Open admin order page and confirm the same `orderNo`, user ID, shop name, amount, and `PENDING` status are visible.
5. Refresh payment status after payment success or closure and confirm both apps show the updated state.

- [ ] **Step 5: Commit any validation fixes**

If validation required fixes:

```bash
git add <changed-files>
git commit -m "fix: stabilize payment order resume flow"
```

If no fixes were needed, do not create an empty commit.

---

## Self-Review

- Spec coverage: management platform real order state, read-only admin status, original `orderNo` resume payment, pre-resume status refresh, error handling, and validation are covered by Tasks 1-9.
- Placeholder scan: no `TBD`, `TODO`, or unspecified implementation steps remain.
- Type consistency: backend uses `orderNo`, `userId`, `PENDING`, `PAID`, `CLOSED`; admin `OrderItem` and user order flow use the same property names returned by `PaymentService.toOrderSummary()`.
