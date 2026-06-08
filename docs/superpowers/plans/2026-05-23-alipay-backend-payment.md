# Alipay Backend Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the web-user Alipay WAP payment flow from the Express demo server into the NestJS backend with Prisma-backed payment order persistence.

**Architecture:** Add a focused `PaymentModule` in `apps/server` with `PaymentController`, `PaymentService`, and `AlipayService`. Persist payment orders in a new Prisma `PaymentOrder` model and keep the existing frontend payment API paths by changing only the `/pay-api` Vite proxy target.

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL, alipay-sdk, Vue 3/Vite, Jest.

---

## File Structure

Create:

- `apps/server/src/modules/payment/payment.module.ts` �?registers controller and services.
- `apps/server/src/modules/payment/payment.controller.ts` �?exposes payment/order endpoints.
- `apps/server/src/modules/payment/payment.service.ts` �?owns order creation, status mapping, persistence, notify processing.
- `apps/server/src/modules/payment/payment.service.spec.ts` �?unit tests for create/status/notify behavior.
- `apps/server/src/modules/payment/dto/create-alipay-wap-payment.dto.ts` �?validates current frontend payload.
- `apps/server/src/modules/payment/alipay/alipay.service.ts` �?wraps `alipay-sdk` and config parsing.
- `apps/server/prisma/migrations/<timestamp>_add_payment_orders/migration.sql` �?creates `payment_orders` table.

Modify:

- `apps/server/package.json` �?add `alipay-sdk` dependency.
- `apps/server/prisma/schema.prisma` �?add `PaymentOrder` model.
- `apps/server/src/config/configuration.ts` �?add `alipay` config block.
- `apps/server/src/app.module.ts` �?import `PaymentModule`.
- `apps/web-user/vite.config.js` �?point `/pay-api` to `http://localhost:3000/api`.
- `apps/web-user/src/services/api/api-payment.js` �?update unavailable error copy and proxy-unavailable detection text.

---

### Task 1: Add Prisma payment order schema

**Files:**
- Modify: `apps/server/prisma/schema.prisma`
- Create: `apps/server/prisma/migrations/<timestamp>_add_payment_orders/migration.sql`

- [ ] **Step 1: Add `PaymentOrder` model to Prisma schema**

Append this model to `apps/server/prisma/schema.prisma`:

```prisma
model PaymentOrder {
  id             Int      @id @default(autoincrement())
  orderNo        String   @unique
  userId         String
  shopId         String?
  shopName       String
  status         String   @default("PENDING")
  tradeStatus    String   @default("WAIT_BUYER_PAY")
  tradeNo        String?
  subject        String
  goodsAmount    Decimal  @db.Decimal(10, 2)
  deliveryFee    Decimal  @db.Decimal(10, 2)
  payableAmount  Decimal  @db.Decimal(10, 2)
  cartItems      Json
  notifyPayload  Json?
  queryPayload   Json?
  buyerPayAmount Decimal? @db.Decimal(10, 2)
  paidAt         DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("payment_orders")
}
```

- [ ] **Step 2: Create migration SQL**

Create a timestamped migration directory under `apps/server/prisma/migrations/`, for example:

```text
apps/server/prisma/migrations/20260523000000_add_payment_orders/migration.sql
```

Use this SQL:

```sql
CREATE TABLE "payment_orders" (
    "id" SERIAL NOT NULL,
    "orderNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT,
    "shopName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "tradeStatus" TEXT NOT NULL DEFAULT 'WAIT_BUYER_PAY',
    "tradeNo" TEXT,
    "subject" TEXT NOT NULL,
    "goodsAmount" DECIMAL(10,2) NOT NULL,
    "deliveryFee" DECIMAL(10,2) NOT NULL,
    "payableAmount" DECIMAL(10,2) NOT NULL,
    "cartItems" JSONB NOT NULL,
    "notifyPayload" JSONB,
    "queryPayload" JSONB,
    "buyerPayAmount" DECIMAL(10,2),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_orders_orderNo_key" ON "payment_orders"("orderNo");
```

- [ ] **Step 3: Generate Prisma client**

Run:

```bash
pnpm --filter @elm-platform/server prisma:generate
```

Expected: command exits 0 and Prisma Client is generated.

---

### Task 2: Add server Alipay configuration and dependency

**Files:**
- Modify: `apps/server/package.json`
- Modify: `apps/server/src/config/configuration.ts`

- [ ] **Step 1: Install `alipay-sdk` for the backend**

Run:

```bash
pnpm --filter @elm-platform/server add alipay-sdk
```

Expected: `apps/server/package.json` contains `"alipay-sdk"` in `dependencies`, and lockfile updates.

- [ ] **Step 2: Add config helpers to `configuration.ts`**

Modify `apps/server/src/config/configuration.ts` so it contains a helper and an `alipay` section:

```ts
function trimMultiline(value = '') {
  return String(value).replace(/\\n/g, '\n').trim()
}

export default () => ({
  app: {
    port: Number.parseInt(process.env.APP_PORT || '3000', 10),
    prefix: process.env.APP_PREFIX || 'api',
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number.parseInt(process.env.REDIS_DB || '0', 10),
  },

  auth: {
    customerLoginAutoRegister: process.env.CUSTOMER_LOGIN_AUTO_REGISTER !== 'false',
  },

  sms: {
    provider: process.env.SMS_PROVIDER || 'mock',
    mockCode: process.env.SMS_MOCK_CODE || undefined,
    codeTtlSeconds: Number.parseInt(process.env.SMS_CODE_TTL_SECONDS || '300', 10),
    cooldownSeconds: Number.parseInt(process.env.SMS_COOLDOWN_SECONDS || '60', 10),
    dailyLimit: Number.parseInt(process.env.SMS_DAILY_LIMIT || '10', 10),
  },

  alipay: {
    gateway: process.env.ALIPAY_GATEWAY || 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
    appId: process.env.ALIPAY_APP_ID || '',
    privateKey: trimMultiline(process.env.ALIPAY_PRIVATE_KEY),
    alipayPublicKey: trimMultiline(process.env.ALIPAY_PUBLIC_KEY),
    notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'http://127.0.0.1:3000/api/payments/alipay/notify',
    returnUrl: process.env.ALIPAY_RETURN_URL || 'http://127.0.0.1:5173/#/payment/result',
    sellerId: process.env.ALIPAY_SELLER_ID || '',
  },
})
```

- [ ] **Step 3: Build to verify config syntax**

Run:

```bash
pnpm --filter @elm-platform/server build
```

Expected: build succeeds or only fails on missing payment module not yet added if this task is executed after app import changes. If it fails earlier, fix the TypeScript syntax before continuing.

---

### Task 3: Add payment DTO and Alipay service

**Files:**
- Create: `apps/server/src/modules/payment/dto/create-alipay-wap-payment.dto.ts`
- Create: `apps/server/src/modules/payment/alipay/alipay.service.ts`

- [ ] **Step 1: Create payment request DTO**

Create `apps/server/src/modules/payment/dto/create-alipay-wap-payment.dto.ts`:

```ts
import { Type } from 'class-transformer'
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'

export class PaymentCartItemDto {
  @IsOptional()
  @IsString()
  itemId?: string

  @IsOptional()
  @IsString()
  id?: string

  @IsOptional()
  @IsString()
  skuId?: string

  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  name?: string

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  qty!: number

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number
}

export class CreateAlipayWapPaymentDto {
  @IsString()
  userId!: string

  @IsOptional()
  @IsString()
  shopId?: string

  @IsOptional()
  @IsString()
  shopName?: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deliveryFee = 0

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentCartItemDto)
  cartItems!: PaymentCartItemDto[]
}
```

- [ ] **Step 2: Create `AlipayService`**

Create `apps/server/src/modules/payment/alipay/alipay.service.ts`:

```ts
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import AlipaySdk from 'alipay-sdk'

interface AlipayConfig {
  gateway: string
  appId: string
  privateKey: string
  alipayPublicKey: string
  notifyUrl: string
  returnUrl: string
  sellerId: string
}

interface PaymentOrderForAlipay {
  orderNo: string
  payableAmount: number
  subject: string
}

@Injectable()
export class AlipayService {
  private sdkInstance: AlipaySdk | null = null

  constructor(private readonly configService: ConfigService) {}

  hasConfig() {
    const config = this.getConfig()
    return Boolean(config.appId && config.privateKey && config.alipayPublicKey)
  }

  createWapPayUrl(order: PaymentOrderForAlipay) {
    const sdk = this.getSdk()
    const config = this.getConfig()

    return sdk.pageExec('alipay.trade.wap.pay', {
      method: 'GET',
      notifyUrl: config.notifyUrl,
      returnUrl: `${config.returnUrl}?orderNo=${order.orderNo}`,
      bizContent: {
        out_trade_no: order.orderNo,
        total_amount: order.payableAmount.toFixed(2),
        subject: order.subject,
        product_code: 'QUICK_WAP_WAY',
        quit_url: `${config.returnUrl.replace('/payment/result', '/payment')}?orderNo=${order.orderNo}`,
      },
    })
  }

  async queryTrade(orderNo: string) {
    const response = await this.getSdk().exec('alipay.trade.query', {
      bizContent: {
        out_trade_no: orderNo,
      },
    })

    return response?.alipay_trade_query_response || response
  }

  verifyNotify(params: Record<string, unknown>) {
    return this.getSdk().checkNotifySign(params)
  }

  getAppId() {
    return this.getConfig().appId
  }

  getSellerId() {
    return this.getConfig().sellerId
  }

  private getSdk() {
    if (!this.sdkInstance) {
      const config = this.getConfig()
      if (!this.hasConfig()) {
        throw new InternalServerErrorException('支付宝配置缺失，请先配置 ALIPAY_APP_ID / ALIPAY_PRIVATE_KEY / ALIPAY_PUBLIC_KEY')
      }

      this.sdkInstance = new AlipaySdk({
        appId: config.appId,
        keyType: 'PKCS1',
        privateKey: config.privateKey,
        alipayPublicKey: config.alipayPublicKey,
        gateway: config.gateway,
        signType: 'RSA2',
        charset: 'utf-8',
        timeout: 5000,
        camelcase: true,
      })
    }

    return this.sdkInstance
  }

  private getConfig(): AlipayConfig {
    return {
      gateway: this.configService.get<string>('alipay.gateway', ''),
      appId: this.configService.get<string>('alipay.appId', ''),
      privateKey: this.configService.get<string>('alipay.privateKey', ''),
      alipayPublicKey: this.configService.get<string>('alipay.alipayPublicKey', ''),
      notifyUrl: this.configService.get<string>('alipay.notifyUrl', ''),
      returnUrl: this.configService.get<string>('alipay.returnUrl', ''),
      sellerId: this.configService.get<string>('alipay.sellerId', ''),
    }
  }
}
```

- [ ] **Step 3: Run build for DTO/service syntax**

Run:

```bash
pnpm --filter @elm-platform/server build
```

Expected: TypeScript compiles once the dependency is installed. If `alipay-sdk` types differ, adjust only `AlipayService` to match the installed package API.

---

### Task 4: Add PaymentService with unit tests

**Files:**
- Create: `apps/server/src/modules/payment/payment.service.ts`
- Create: `apps/server/src/modules/payment/payment.service.spec.ts`

- [ ] **Step 1: Write unit tests**

Create `apps/server/src/modules/payment/payment.service.spec.ts`:

```ts
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { PaymentService } from './payment.service'

function createOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    orderNo: 'ELMALI202605231234560001',
    userId: '1',
    shopId: '101',
    shopName: '示例商家',
    status: 'PENDING',
    tradeStatus: 'WAIT_BUYER_PAY',
    tradeNo: null,
    subject: '示例商家 外卖订单',
    goodsAmount: { toNumber: () => 24 },
    deliveryFee: { toNumber: () => 5 },
    payableAmount: { toNumber: () => 29 },
    cartItems: [{ itemId: '1001', skuId: '1001', title: '商品', qty: 2, unitPrice: 12, totalPrice: 24 }],
    notifyPayload: null,
    queryPayload: null,
    buyerPayAmount: null,
    paidAt: null,
    createdAt: new Date('2026-05-23T00:00:00.000Z'),
    updatedAt: new Date('2026-05-23T00:00:00.000Z'),
    ...overrides,
  }
}

function createService() {
  const order = createOrder()
  const prisma = {
    paymentOrder: {
      create: jest.fn().mockResolvedValue(order),
      findUnique: jest.fn().mockResolvedValue(order),
      findMany: jest.fn().mockResolvedValue([order]),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve(createOrder(data))),
    },
  } as any

  const alipay = {
    hasConfig: jest.fn().mockReturnValue(true),
    createWapPayUrl: jest.fn().mockReturnValue('https://openapi-sandbox.dl.alipaydev.com/gateway.do?method=alipay.trade.wap.pay'),
    queryTrade: jest.fn().mockResolvedValue({ trade_status: 'TRADE_SUCCESS', trade_no: '2026052322001400000500000001', buyer_pay_amount: '29.00' }),
    verifyNotify: jest.fn().mockReturnValue(true),
    getAppId: jest.fn().mockReturnValue('app-id'),
    getSellerId: jest.fn().mockReturnValue('seller-id'),
  } as any

  return { service: new PaymentService(prisma, alipay), prisma, alipay, order }
}

describe('PaymentService', () => {
  it('creates a persisted Alipay WAP payment order', async () => {
    const { service, prisma, alipay } = createService()

    const result = await service.createAlipayWapPayment({
      userId: '1',
      shopId: '101',
      shopName: '示例商家',
      deliveryFee: 5,
      cartItems: [{ itemId: '1001', skuId: '1001', title: '商品', qty: 2, unitPrice: 12 }],
    })

    expect(prisma.paymentOrder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: '1',
        shopId: '101',
        shopName: '示例商家',
        subject: '示例商家 外卖订单',
        goodsAmount: 24,
        deliveryFee: 5,
        payableAmount: 29,
        status: 'PENDING',
        tradeStatus: 'WAIT_BUYER_PAY',
      }),
    })
    expect(alipay.createWapPayUrl).toHaveBeenCalledWith(expect.objectContaining({ payableAmount: 29 }))
    expect(result.payUrl).toContain('alipay.trade.wap.pay')
    expect(result.payableAmount).toBe(29)
  })

  it('rejects missing users', async () => {
    const { service } = createService()

    await expect(service.createAlipayWapPayment({ userId: '', cartItems: [], deliveryFee: 0 } as any))
      .rejects
      .toThrow(UnauthorizedException)
  })

  it('rejects empty carts', async () => {
    const { service } = createService()

    await expect(service.createAlipayWapPayment({ userId: '1', cartItems: [], deliveryFee: 0 }))
      .rejects
      .toThrow(BadRequestException)
  })

  it('refreshes status from Alipay when requested', async () => {
    const { service, prisma, alipay } = createService()

    const result = await service.getAlipayPaymentStatus('ELMALI202605231234560001', true)

    expect(alipay.queryTrade).toHaveBeenCalledWith('ELMALI202605231234560001')
    expect(prisma.paymentOrder.update).toHaveBeenCalledWith({
      where: { orderNo: 'ELMALI202605231234560001' },
      data: expect.objectContaining({
        tradeNo: '2026052322001400000500000001',
        tradeStatus: 'TRADE_SUCCESS',
        status: 'PAID',
        buyerPayAmount: 29,
      }),
    })
    expect(result.status).toBe('PAID')
  })

  it('throws when the order does not exist', async () => {
    const { service, prisma } = createService()
    prisma.paymentOrder.findUnique.mockResolvedValue(null)

    await expect(service.getAlipayPaymentStatus('missing', false)).rejects.toThrow(NotFoundException)
  })

  it('updates order from a valid notify payload', async () => {
    const { service, prisma } = createService()

    const result = await service.handleAlipayNotify({
      app_id: 'app-id',
      seller_id: 'seller-id',
      out_trade_no: 'ELMALI202605231234560001',
      trade_no: '2026052322001400000500000001',
      trade_status: 'TRADE_SUCCESS',
      total_amount: '29.00',
      gmt_payment: '2026-05-23 12:00:00',
    })

    expect(result).toBe(true)
    expect(prisma.paymentOrder.update).toHaveBeenCalledWith({
      where: { orderNo: 'ELMALI202605231234560001' },
      data: expect.objectContaining({
        tradeStatus: 'TRADE_SUCCESS',
        status: 'PAID',
      }),
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @elm-platform/server test -- payment.service.spec.ts
```

Expected: FAIL because `payment.service.ts` does not exist.

- [ ] **Step 3: Implement `PaymentService`**

Create `apps/server/src/modules/payment/payment.service.ts`:

```ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AlipayService } from './alipay/alipay.service'
import { CreateAlipayWapPaymentDto, PaymentCartItemDto } from './dto/create-alipay-wap-payment.dto'

type PaymentStatus = 'PENDING' | 'PAID' | 'CLOSED'

type PaymentOrderRecord = Awaited<ReturnType<PrismaService['paymentOrder']['findUnique']>> & Record<string, any>

function toPrice(value: unknown) {
  const amount = Number.parseFloat(String(value))
  return Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0
}

function toQty(value: unknown) {
  const qty = Number.parseInt(String(value), 10)
  return Number.isFinite(qty) && qty > 0 ? qty : 0
}

function toDate(value: unknown) {
  if (!value)
    return null
  const normalized = String(value).replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alipay: AlipayService,
  ) {}

  async createAlipayWapPayment(payload: CreateAlipayWapPaymentDto) {
    const summary = this.buildOrderPayload(payload)

    if (!summary.userId)
      throw new UnauthorizedException('请登录后再支�?)
    if (!summary.cartItems.length)
      throw new BadRequestException('购物车为空，无法创建支付�?)
    if (summary.payableAmount <= 0)
      throw new BadRequestException('订单金额异常，无法创建支付单')

    const orderNo = this.createOrderNo()
    const subject = `${summary.shopName} 外卖订单`

    const order = await this.prisma.paymentOrder.create({
      data: {
        orderNo,
        status: 'PENDING',
        tradeStatus: 'WAIT_BUYER_PAY',
        subject,
        userId: summary.userId,
        shopId: summary.shopId,
        shopName: summary.shopName,
        cartItems: summary.cartItems,
        goodsAmount: summary.goodsAmount,
        deliveryFee: summary.deliveryFee,
        payableAmount: summary.payableAmount,
      },
    })

    const payUrl = this.alipay.createWapPayUrl({
      orderNo,
      payableAmount: summary.payableAmount,
      subject,
    })

    return {
      orderNo: order.orderNo,
      payUrl,
      payableAmount: summary.payableAmount,
    }
  }

  async getAlipayPaymentStatus(orderNo: string, refresh = true) {
    const order = await this.findOrder(orderNo)

    if (refresh && this.alipay.hasConfig()) {
      try {
        const trade = await this.alipay.queryTrade(orderNo)
        const tradeStatus = String(trade?.trade_status || order.tradeStatus)
        await this.prisma.paymentOrder.update({
          where: { orderNo },
          data: {
            tradeNo: trade?.trade_no || order.tradeNo,
            tradeStatus,
            status: this.mapTradeStatus(tradeStatus),
            queryPayload: trade || undefined,
            buyerPayAmount: trade?.buyer_pay_amount ? toPrice(trade.buyer_pay_amount) : undefined,
          },
        })
      }
      catch (error) {
        console.error('[alipay:status]', error)
      }
    }

    return this.toOrderSummary(await this.findOrder(orderNo))
  }

  async listOrders(userId: string, limit?: unknown) {
    const take = Number.parseInt(String(limit || ''), 10)
    const orders = await this.prisma.paymentOrder.findMany({
      where: { userId: String(userId) },
      orderBy: [{ paidAt: 'desc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: Number.isFinite(take) && take > 0 ? take : 20,
    })

    return { orders: orders.map(order => this.toOrderSummary(order)) }
  }

  async handleAlipayNotify(payload: Record<string, unknown>) {
    const isValid = await this.alipay.verifyNotify(payload)
    if (!isValid)
      return false

    const orderNo = String(payload.out_trade_no || '')
    const order = await this.findOrder(orderNo)

    if (String(payload.app_id || '') !== this.alipay.getAppId())
      return false

    const sellerId = this.alipay.getSellerId()
    if (sellerId && String(payload.seller_id || '') !== sellerId)
      return false

    if (toPrice(payload.total_amount) !== toPrice(order.payableAmount))
      return false

    const tradeStatus = String(payload.trade_status || order.tradeStatus)
    await this.prisma.paymentOrder.update({
      where: { orderNo },
      data: {
        tradeNo: String(payload.trade_no || order.tradeNo || ''),
        tradeStatus,
        status: this.mapTradeStatus(tradeStatus),
        notifyPayload: payload,
        paidAt: toDate(payload.gmt_payment),
      },
    })

    return true
  }

  private buildOrderPayload(payload: CreateAlipayWapPaymentDto) {
    const cartItems = (payload.cartItems || [])
      .map(item => this.normalizeCartItem(item))
      .filter(item => item.itemId && item.qty > 0 && item.unitPrice > 0)
    const goodsAmount = toPrice(cartItems.reduce((sum, item) => sum + item.totalPrice, 0))
    const deliveryFee = toPrice(payload.deliveryFee)

    return {
      userId: String(payload.userId || ''),
      shopId: payload.shopId ? String(payload.shopId) : null,
      shopName: String(payload.shopName || '饿了么订�?),
      cartItems,
      goodsAmount,
      deliveryFee,
      payableAmount: toPrice(goodsAmount + deliveryFee),
    }
  }

  private normalizeCartItem(item: PaymentCartItemDto) {
    const qty = toQty(item.qty)
    const unitPrice = toPrice(item.unitPrice)

    return {
      itemId: String(item.itemId || item.id || ''),
      skuId: String(item.skuId || item.itemId || item.id || ''),
      title: String(item.title || item.name || '商品'),
      qty,
      unitPrice,
      totalPrice: toPrice(unitPrice * qty),
    }
  }

  private async findOrder(orderNo: string) {
    const order = await this.prisma.paymentOrder.findUnique({ where: { orderNo } })
    if (!order)
      throw new NotFoundException('订单不存�?)
    return order as PaymentOrderRecord
  }

  private toOrderSummary(order: PaymentOrderRecord) {
    const cartItems = Array.isArray(order.cartItems) ? order.cartItems : []

    return {
      orderNo: order.orderNo,
      userId: order.userId,
      shopId: order.shopId,
      shopName: order.shopName,
      status: order.status,
      tradeStatus: order.tradeStatus,
      payableAmount: toPrice(order.payableAmount),
      goodsAmount: toPrice(order.goodsAmount),
      deliveryFee: toPrice(order.deliveryFee),
      cartItems,
      totalQty: cartItems.reduce((sum, item) => sum + Number(item.qty || 0), 0),
      paidAt: order.paidAt || null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      tradeNo: order.tradeNo || null,
    }
  }

  private createOrderNo() {
    const stamp = Date.now().toString()
    const random = Math.floor(Math.random() * 9000 + 1000)
    return `ELMALI${stamp}${random}`
  }

  private mapTradeStatus(tradeStatus: string): PaymentStatus {
    switch (tradeStatus) {
      case 'TRADE_SUCCESS':
      case 'TRADE_FINISHED':
        return 'PAID'
      case 'TRADE_CLOSED':
        return 'CLOSED'
      case 'WAIT_BUYER_PAY':
      default:
        return 'PENDING'
    }
  }
}
```

- [ ] **Step 4: Run service tests**

Run:

```bash
pnpm --filter @elm-platform/server test -- payment.service.spec.ts
```

Expected: PASS.

---

### Task 5: Add controller and module

**Files:**
- Create: `apps/server/src/modules/payment/payment.controller.ts`
- Create: `apps/server/src/modules/payment/payment.module.ts`
- Modify: `apps/server/src/app.module.ts`

- [ ] **Step 1: Create `PaymentController`**

Create `apps/server/src/modules/payment/payment.controller.ts`:

```ts
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../common/interceptors/transform.interceptor'
import { CreateAlipayWapPaymentDto } from './dto/create-alipay-wap-payment.dto'
import { PaymentService } from './payment.service'

@ApiTags('支付')
@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('payments/alipay/wap/create')
  @ApiOperation({ summary: '创建支付�?WAP 支付�? })
  createAlipayWapPayment(@Body() dto: CreateAlipayWapPaymentDto) {
    return rawResponse(this.paymentService.createAlipayWapPayment(dto))
  }

  @Get('payments/alipay/status/:orderNo')
  @ApiOperation({ summary: '查询支付宝支付状�? })
  getAlipayPaymentStatus(
    @Param('orderNo') orderNo: string,
    @Query('refresh') refresh?: string,
  ) {
    return rawResponse(this.paymentService.getAlipayPaymentStatus(orderNo, refresh !== '0'))
  }

  @Post('payments/alipay/notify')
  @ApiOperation({ summary: '支付宝异步通知' })
  async handleAlipayNotify(@Body() body: Record<string, unknown>) {
    const ok = await this.paymentService.handleAlipayNotify(body)
    return rawResponse(ok ? 'success' : 'failure')
  }

  @Get('orders')
  @ApiOperation({ summary: '用户支付订单列表' })
  listOrders(@Query('userId') userId: string, @Query('limit') limit?: string) {
    return rawResponse(this.paymentService.listOrders(userId, limit))
  }
}
```

- [ ] **Step 2: Create `PaymentModule`**

Create `apps/server/src/modules/payment/payment.module.ts`:

```ts
import { Module } from '@nestjs/common'
import { AlipayService } from './alipay/alipay.service'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, AlipayService],
  exports: [PaymentService],
})
export class PaymentModule {}
```

- [ ] **Step 3: Register module in app**

Modify `apps/server/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import configuration from './config/configuration'
import { AdminModule } from './modules/admin/admin.module'
import { AuthModule } from './modules/auth/auth.module'
import { CustomerAuthModule } from './modules/customer-auth/customer-auth.module'
import { ElmModule } from './modules/elm/elm.module'
import { PaymentModule } from './modules/payment/payment.module'
import { UserModule } from './modules/user/user.module'
import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './redis/redis.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    RedisModule,
    UserModule,
    AuthModule,
    CustomerAuthModule,
    AdminModule,
    ElmModule,
    PaymentModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 4: Run backend build**

Run:

```bash
pnpm --filter @elm-platform/server build
```

Expected: PASS.

---

### Task 6: Update frontend payment proxy and unavailable message

**Files:**
- Modify: `apps/web-user/vite.config.js`
- Modify: `apps/web-user/src/services/api/api-payment.js`

- [ ] **Step 1: Change `/pay-api` proxy target**

Modify only this block in `apps/web-user/vite.config.js`:

```js
'/pay-api': {
  target: 'http://localhost:3000/api',
  changeOrigin: true,
  rewrite: path => path.replace(/^\/pay-api/, ''),
},
```

- [ ] **Step 2: Update payment API unavailable copy**

Modify `apps/web-user/src/services/api/api-payment.js`:

```js
export const PAY_API_UNAVAILABLE_MESSAGE
  = '后端支付服务未启动或不可用，请先运行 pnpm --filter @elm-platform/server run dev 后再重试�?
```

Also update the proxy detection regex to include port 3000:

```js
return (
  [502, 503, 504].includes(status)
  || (status === 500 && /proxy|ECONNREFUSED|localhost:3000|127\.0\.0\.1:3000|pay-api/i.test(message))
)
```

- [ ] **Step 3: Run web-user type check**

Run:

```bash
pnpm --filter @elm-platform/web-user run type-check
```

Expected: PASS.

---

### Task 7: Run database migration and final verification

**Files:**
- Runtime verification only.

- [ ] **Step 1: Apply Prisma migration**

Run:

```bash
pnpm --filter @elm-platform/server prisma:migrate
```

Expected: migration applies and `payment_orders` exists. If this fails because PostgreSQL or `DATABASE_URL` is unavailable, stop and ask the user to start the database or provide the correct environment.

- [ ] **Step 2: Run backend tests**

Run:

```bash
pnpm --filter @elm-platform/server test -- payment.service.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Run backend build**

Run:

```bash
pnpm --filter @elm-platform/server build
```

Expected: PASS.

- [ ] **Step 4: Run frontend type check**

Run:

```bash
pnpm --filter @elm-platform/web-user run type-check
```

Expected: PASS.

- [ ] **Step 5: Manual runtime check with missing Alipay config**

Start backend:

```bash
pnpm --filter @elm-platform/server run dev
```

In another terminal, start frontend:

```bash
pnpm --filter @elm-platform/web-user run dev
```

Expected before real Alipay config is provided: creating a payment returns a readable backend error saying Alipay config is missing, and the frontend no longer references the old 3001 demo server.

- [ ] **Step 6: Manual runtime check with sandbox config**

Set these values in the backend environment:

```env
ALIPAY_GATEWAY=https://openapi-sandbox.dl.alipaydev.com/gateway.do
ALIPAY_APP_ID=your-sandbox-app-id
ALIPAY_PRIVATE_KEY=your-application-private-key
ALIPAY_PUBLIC_KEY=your-alipay-public-key
ALIPAY_NOTIFY_URL=http://127.0.0.1:3000/api/payments/alipay/notify
ALIPAY_RETURN_URL=http://127.0.0.1:5173/#/payment/result
ALIPAY_SELLER_ID=your-sandbox-seller-id
```

Then run the flow:

```text
登录 -> 商家页加�?-> 结算 -> /payment -> 确认支付 -> 支付宝沙�?-> /payment/result
```

Expected: the app redirects to Alipay, returns to `/payment/result?orderNo=...`, calls `/pay-api/payments/alipay/status/:orderNo?refresh=1`, and displays paid status after Alipay query succeeds.

---

## Self-Review

- Spec coverage: covered backend module, Prisma model/migration, Alipay SDK dependency, compatible API routes, frontend proxy, config migration, create/status/notify/list data flow, and validation commands.
- Placeholder scan: no `TBD`, `TODO`, or unspecified implementation steps remain. Environment examples use explicit `your-*` values because secrets must come from the user's sandbox account.
- Type consistency: the plan consistently uses `PaymentOrder`, `PaymentService`, `AlipayService`, `CreateAlipayWapPaymentDto`, `orderNo`, `tradeStatus`, `payableAmount`, and the route names from the spec.

