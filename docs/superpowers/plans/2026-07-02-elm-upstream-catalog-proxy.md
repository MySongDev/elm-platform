# Elm Upstream Catalog Proxy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将商铺列表、食品分类、菜单列表和商铺详情从本地种子数据切换为 Nest 服务端代理 `https://elm.cangdu.org` 的真实数据。

**Architecture:** 新增单一职责的 `ElmUpstreamService`，统一完成固定路径请求、查询参数序列化、超时和 502 错误映射。现有三个公开 Controller 保留 `/api` 兼容路由，只把四个读方法改为等待上游服务并通过 `rawResponse` 原样返回；后台写接口和其他种子数据接口保持不变。

**Tech Stack:** NestJS 10、TypeScript、Node.js `fetch`/`AbortController`、`@nestjs/config`、Jest

---

## 文件结构

- Create: `apps/server/src/modules/elm/services/elm-upstream.service.ts`
  - 只负责安全调用固定的 Elm 上游路径并规范化失败。
- Create: `apps/server/src/modules/elm/services/elm-upstream.service.spec.ts`
  - 覆盖 URL、查询参数、成功、状态码、网络、超时和 JSON 解析。
- Create: `apps/server/src/modules/elm/controllers/elm-upstream-public.controller.spec.ts`
  - 覆盖四个公开 Controller 方法的代理路径、参数和 raw response。
- Create: `apps/server/src/config/elm-api-config.spec.ts`
  - 锁定环境变量校验和运行时配置映射。
- Modify: `apps/server/src/config/env.schema.ts`
  - 校验 `ELM_API_BASE_URL` 和 `ELM_API_TIMEOUT_MS`。
- Modify: `apps/server/src/config/configuration.ts`
  - 暴露 `elmApi.baseUrl` 和 `elmApi.timeoutMs`。
- Modify: `apps/server/src/modules/elm/controllers/elm-location.controller.ts`
  - 将食品分类列表改为上游代理。
- Modify: `apps/server/src/modules/elm/controllers/elm-restaurant-public.controller.ts`
  - 将商铺列表和商铺详情改为上游代理。
- Modify: `apps/server/src/modules/elm/controllers/elm-food-public.controller.ts`
  - 将菜单列表改为上游代理。
- Modify: `apps/server/src/modules/elm/elm.module.ts`
  - 注册并导出 `ElmUpstreamService`。
- Modify: `apps/server/.env.example`
  - 记录上游地址和超时配置。

### Task 1: 增加 Elm 上游配置

**Files:**
- Create: `apps/server/src/config/elm-api-config.spec.ts`
- Modify: `apps/server/src/config/env.schema.ts`
- Modify: `apps/server/src/config/configuration.ts`
- Modify: `apps/server/.env.example`

- [ ] **Step 1: 编写失败的配置测试**

创建 `apps/server/src/config/elm-api-config.spec.ts`：

```ts
import configuration from './configuration'
import { validateEnv } from './env.schema'

describe('Elm API configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/elm_test',
    }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('provides safe defaults', () => {
    delete process.env.ELM_API_BASE_URL
    delete process.env.ELM_API_TIMEOUT_MS

    expect(configuration().elmApi).toEqual({
      baseUrl: 'https://elm.cangdu.org',
      timeoutMs: 8000,
    })
  })

  it('maps validated environment values', () => {
    process.env.ELM_API_BASE_URL = 'https://elm.example.test'
    process.env.ELM_API_TIMEOUT_MS = '2500'

    expect(validateEnv(process.env)).toEqual(expect.objectContaining({
      ELM_API_BASE_URL: 'https://elm.example.test',
      ELM_API_TIMEOUT_MS: 2500,
    }))
    expect(configuration().elmApi).toEqual({
      baseUrl: 'https://elm.example.test',
      timeoutMs: 2500,
    })
  })

  it('rejects an invalid base URL and non-positive timeout', () => {
    expect(() => validateEnv({
      ...process.env,
      ELM_API_BASE_URL: 'not-a-url',
      ELM_API_TIMEOUT_MS: '0',
    })).toThrow('Environment validation failed')
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
pnpm --filter @elm-platform/server run test -- config/elm-api-config.spec.ts --runInBand
```

Expected: FAIL；`configuration().elmApi` 为 `undefined`，或校验结果缺少 `ELM_API_*`。

- [ ] **Step 3: 实现环境校验和配置映射**

在 `apps/server/src/config/env.schema.ts` 的 `APP_PREFIX` 后加入：

```ts
  ELM_API_BASE_URL: z.url().default('https://elm.cangdu.org'),
  ELM_API_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
```

在 `apps/server/src/config/configuration.ts` 的 `app` 配置后加入：

```ts
  elmApi: {
    baseUrl: process.env.ELM_API_BASE_URL || 'https://elm.cangdu.org',
    timeoutMs: Number.parseInt(process.env.ELM_API_TIMEOUT_MS || '8000', 10),
  },
```

在 `apps/server/.env.example` 的应用配置段后加入：

```dotenv
# Elm 商品目录上游
ELM_API_BASE_URL=https://elm.cangdu.org
ELM_API_TIMEOUT_MS=8000
```

- [ ] **Step 4: 运行配置测试并确认通过**

Run:

```bash
pnpm --filter @elm-platform/server run test -- config/elm-api-config.spec.ts --runInBand
```

Expected: PASS，3 tests passed。

- [ ] **Step 5: 提交配置**

```bash
git add apps/server/src/config/elm-api-config.spec.ts apps/server/src/config/env.schema.ts apps/server/src/config/configuration.ts apps/server/.env.example
git commit -m "feat(server): configure Elm catalog upstream"
```

### Task 2: 实现安全的 Elm 上游客户端

**Files:**
- Create: `apps/server/src/modules/elm/services/elm-upstream.service.spec.ts`
- Create: `apps/server/src/modules/elm/services/elm-upstream.service.ts`

- [ ] **Step 1: 编写 URL 和成功响应的失败测试**

创建 `apps/server/src/modules/elm/services/elm-upstream.service.spec.ts`：

```ts
import { BadGatewayException } from '@nestjs/common'
import { ElmUpstreamService } from './elm-upstream.service'

function createService(timeoutMs = 8000) {
  const configService = {
    get: jest.fn((key: string, fallback: unknown) => {
      if (key === 'elmApi.baseUrl')
        return 'https://elm.example.test/'
      if (key === 'elmApi.timeoutMs')
        return timeoutMs
      return fallback
    }),
  }

  return new ElmUpstreamService(configService as any)
}

describe('ElmUpstreamService', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('serializes scalar, repeated array, and present query values', async () => {
    const payload = [{ id: 1, name: 'restaurant' }]
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(payload),
    } as any)
    const service = createService()

    await expect(service.get('/shopping/restaurants', {
      latitude: 31.23,
      longitude: '121.47',
      support_ids: [7, 9],
      empty: '',
      nil: null,
      missing: undefined,
    })).resolves.toBe(payload)

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0]
    const parsed = new URL(url)
    expect(parsed.origin).toBe('https://elm.example.test')
    expect(parsed.pathname).toBe('/shopping/restaurants')
    expect(parsed.searchParams.get('latitude')).toBe('31.23')
    expect(parsed.searchParams.get('longitude')).toBe('121.47')
    expect(parsed.searchParams.getAll('support_ids')).toEqual(['7', '9'])
    expect(parsed.searchParams.get('empty')).toBe('')
    expect(parsed.searchParams.has('nil')).toBe(false)
    expect(parsed.searchParams.has('missing')).toBe(false)
    expect(options).toEqual(expect.objectContaining({
      method: 'GET',
      signal: expect.any(AbortSignal),
    }))
  })

  it.each([
    ['non-2xx response', async () => ({
      ok: false,
      status: 503,
      json: jest.fn(),
    })],
    ['network failure', async () => Promise.reject(new Error('ECONNREFUSED'))],
    ['invalid JSON', async () => ({
      ok: true,
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    })],
  ])('maps %s to BadGatewayException', async (_name, fetchResult) => {
    global.fetch = jest.fn().mockImplementation(fetchResult as any)
    const service = createService()

    await expect(service.get('/v2/index_entry')).rejects.toBeInstanceOf(BadGatewayException)
  })

  it('aborts a request after the configured timeout', async () => {
    jest.useFakeTimers()
    global.fetch = jest.fn((_url: string, options: RequestInit) =>
      new Promise((_resolve, reject) => {
        options.signal?.addEventListener('abort', () => {
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
        })
      })) as any
    const service = createService(25)

    const request = service.get('/shopping/v2/menu', { restaurant_id: 1 })
    await jest.advanceTimersByTimeAsync(25)

    await expect(request).rejects.toBeInstanceOf(BadGatewayException)
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
pnpm --filter @elm-platform/server run test -- modules/elm/services/elm-upstream.service.spec.ts --runInBand
```

Expected: FAIL with `Cannot find module './elm-upstream.service'`。

- [ ] **Step 3: 编写最小上游客户端实现**

创建 `apps/server/src/modules/elm/services/elm-upstream.service.ts`：

```ts
import { BadGatewayException, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

type QueryValue = unknown

@Injectable()
export class ElmUpstreamService {
  private readonly logger = new Logger(ElmUpstreamService.name)

  constructor(private readonly configService: ConfigService) {}

  async get<T = unknown>(
    path: `/${string}`,
    query: Record<string, QueryValue> = {},
  ): Promise<T> {
    const baseUrl = this.configService
      .get<string>('elmApi.baseUrl', 'https://elm.cangdu.org')
      .replace(/\/+$/, '')
    const timeoutMs = this.configService.get<number>('elmApi.timeoutMs', 8000)
    const url = new URL(`${baseUrl}${path}`)

    for (const [key, value] of Object.entries(query)) {
      if (value == null)
        continue

      if (Array.isArray(value)) {
        for (const item of value) {
          if (item != null)
            url.searchParams.append(key, String(item))
        }
        continue
      }

      url.searchParams.append(key, String(value))
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`upstream responded with HTTP ${response.status}`)
      }

      return await response.json() as T
    }
    catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      this.logger.error(`Elm upstream GET ${path} failed: ${reason}`)
      throw new BadGatewayException(`Elm upstream request failed: ${path}`)
    }
    finally {
      clearTimeout(timeout)
    }
  }
}
```

- [ ] **Step 4: 运行上游客户端测试并确认通过**

Run:

```bash
pnpm --filter @elm-platform/server run test -- modules/elm/services/elm-upstream.service.spec.ts --runInBand
```

Expected: PASS，4 tests passed。

- [ ] **Step 5: 提交上游客户端**

```bash
git add apps/server/src/modules/elm/services/elm-upstream.service.ts apps/server/src/modules/elm/services/elm-upstream.service.spec.ts
git commit -m "feat(server): add Elm upstream client"
```

### Task 3: 将四个公开读接口切换到上游

**Files:**
- Create: `apps/server/src/modules/elm/controllers/elm-upstream-public.controller.spec.ts`
- Modify: `apps/server/src/modules/elm/controllers/elm-location.controller.ts`
- Modify: `apps/server/src/modules/elm/controllers/elm-restaurant-public.controller.ts`
- Modify: `apps/server/src/modules/elm/controllers/elm-food-public.controller.ts`
- Modify: `apps/server/src/modules/elm/elm.module.ts`

- [ ] **Step 1: 编写 Controller 代理行为的失败测试**

创建 `apps/server/src/modules/elm/controllers/elm-upstream-public.controller.spec.ts`：

```ts
import { ElmFoodPublicController } from './elm-food-public.controller'
import { ElmLocationController } from './elm-location.controller'
import { ElmRestaurantPublicController } from './elm-restaurant-public.controller'

function createControllers() {
  const cityService = {}
  const restaurantService = {}
  const foodService = {}
  const upstream = {
    get: jest.fn(),
  }

  return {
    upstream,
    location: new ElmLocationController(cityService as any, upstream as any),
    restaurant: new ElmRestaurantPublicController(
      cityService as any,
      restaurantService as any,
      upstream as any,
    ),
    food: new ElmFoodPublicController(foodService as any, upstream as any),
  }
}

describe('Elm public catalog upstream controllers', () => {
  it('proxies index entries without seed data fallback', async () => {
    const { location, upstream } = createControllers()
    const payload = [{ id: 1, title: '美食' }]
    upstream.get.mockResolvedValue(payload)

    await expect(location.getIndexEntry()).resolves.toEqual({
      __rawResponse: true,
      payload,
    })
    expect(upstream.get).toHaveBeenCalledWith('/v2/index_entry')
  })

  it('proxies the complete restaurant list query', async () => {
    const { restaurant, upstream } = createControllers()
    const query = {
      latitude: '31.23',
      longitude: '121.47',
      support_ids: ['7', '9'],
    }
    upstream.get.mockResolvedValue([])

    await restaurant.getRestaurants(query)

    expect(upstream.get).toHaveBeenCalledWith('/shopping/restaurants', query)
  })

  it('proxies a restaurant detail with its validated id', async () => {
    const { restaurant, upstream } = createControllers()
    upstream.get.mockResolvedValue({ id: 42 })

    await restaurant.getRestaurant(42)

    expect(upstream.get).toHaveBeenCalledWith('/shopping/restaurant/42')
  })

  it('proxies a menu with restaurant_id', async () => {
    const { food, upstream } = createControllers()
    upstream.get.mockResolvedValue([])

    await food.getMenu(42)

    expect(upstream.get).toHaveBeenCalledWith('/shopping/v2/menu', {
      restaurant_id: 42,
    })
  })
})
```

- [ ] **Step 2: 运行 Controller 测试并确认失败**

Run:

```bash
pnpm --filter @elm-platform/server run test -- modules/elm/controllers/elm-upstream-public.controller.spec.ts --runInBand
```

Expected: FAIL；Controller 构造函数尚未接受 `ElmUpstreamService`，四个方法仍调用本地 service。

- [ ] **Step 3: 注入上游服务并替换四个方法**

在三个 Controller 中加入：

```ts
import { ElmUpstreamService } from '../services/elm-upstream.service'
```

将 `ElmLocationController` 构造函数和分类方法改为：

```ts
  constructor(
    private readonly cityService: ElmCityService,
    private readonly upstream: ElmUpstreamService,
  ) {}

  @Get('v2/index_entry')
  @ApiOperation({ summary: '食品分类列表' })
  async getIndexEntry() {
    return rawResponse(await this.upstream.get('/v2/index_entry'))
  }
```

将 `ElmRestaurantPublicController` 构造函数、商铺列表和商铺详情方法改为：

```ts
  constructor(
    private readonly cityService: ElmCityService,
    private readonly restaurantService: ElmRestaurantService,
    private readonly upstream: ElmUpstreamService,
  ) {}

  @Get('shopping/restaurants')
  @ApiOperation({ summary: '获取商铺列表' })
  async getRestaurants(@Query() query: Record<string, unknown>) {
    return rawResponse(await this.upstream.get('/shopping/restaurants', query))
  }

  @Get('shopping/restaurant/:shopId')
  @ApiOperation({ summary: '餐馆详情' })
  async getRestaurant(@Param('shopId', ParseIntPipe) shopId: number) {
    return rawResponse(await this.upstream.get(`/shopping/restaurant/${shopId}`))
  }
```

将 `ElmFoodPublicController` 构造函数和菜单方法改为：

```ts
  constructor(
    private readonly foodService: ElmFoodService,
    private readonly upstream: ElmUpstreamService,
  ) {}

  @Get('shopping/v2/menu')
  @ApiOperation({ summary: '获取菜单列表' })
  async getMenu(@Query('restaurant_id', ParseIntPipe) restaurantId: number) {
    return rawResponse(await this.upstream.get('/shopping/v2/menu', {
      restaurant_id: restaurantId,
    }))
  }
```

保留三个 Controller 的其他方法不变。

在 `apps/server/src/modules/elm/elm.module.ts` 导入服务：

```ts
import { ElmUpstreamService } from './services/elm-upstream.service'
```

并把 `ElmUpstreamService` 同时加入 `providers` 和 `exports`：

```ts
  providers: [
    ElmStoreService,
    ElmUpstreamService,
    ElmCityService,
    ElmRestaurantService,
    ElmFoodService,
    ElmUserCompatService,
    ElmOrderService,
  ],
  exports: [
    ElmUpstreamService,
    ElmCityService,
    ElmRestaurantService,
    ElmFoodService,
    ElmUserCompatService,
    ElmOrderService,
  ],
```

- [ ] **Step 4: 运行 Controller 和客户端测试并确认通过**

Run:

```bash
pnpm --filter @elm-platform/server run test -- modules/elm/controllers/elm-upstream-public.controller.spec.ts modules/elm/services/elm-upstream.service.spec.ts --runInBand
```

Expected: PASS，两个 suites 全部通过。

- [ ] **Step 5: 确认四个方法不再读取种子服务**

Run:

```powershell
Get-Content apps/server/src/modules/elm/controllers/elm-location.controller.ts
Get-Content apps/server/src/modules/elm/controllers/elm-restaurant-public.controller.ts
Get-Content apps/server/src/modules/elm/controllers/elm-food-public.controller.ts
```

Expected:

- `getIndexEntry` 只调用 `upstream.get('/v2/index_entry')`。
- `getRestaurants` 只调用 `upstream.get('/shopping/restaurants', query)`。
- `getRestaurant` 只调用固定详情路径。
- `getMenu` 只调用固定菜单路径。
- 后台写方法和其余兼容接口仍保留原有 service。

- [ ] **Step 6: 提交 Controller 切换**

```bash
git add apps/server/src/modules/elm/controllers/elm-upstream-public.controller.spec.ts apps/server/src/modules/elm/controllers/elm-location.controller.ts apps/server/src/modules/elm/controllers/elm-restaurant-public.controller.ts apps/server/src/modules/elm/controllers/elm-food-public.controller.ts apps/server/src/modules/elm/elm.module.ts
git commit -m "feat(server): proxy public catalog reads to Elm"
```

### Task 4: 完整验证与真实上游冒烟

**Files:**
- Verify only; no expected source changes.

- [ ] **Step 1: 运行 Elm 模块相关测试**

Run:

```bash
pnpm --filter @elm-platform/server run test -- modules/elm --runInBand
```

Expected: PASS；所有 `modules/elm` 测试套件通过。

- [ ] **Step 2: 运行服务端构建**

Run:

```bash
pnpm --filter @elm-platform/server run build
```

Expected: exit code 0，Nest TypeScript 编译完成且没有类型错误。

- [ ] **Step 3: 检查差异质量与工作区边界**

Run:

```bash
git diff --check HEAD~3
git status --short
```

Expected:

- `git diff --check` 无输出。
- 本功能提交只包含计划列出的服务端文件。
- 用户原有的城市定位、SWR 等未提交修改仍存在且未被暂存或覆盖。

- [ ] **Step 4: 对真实上游执行只读冒烟请求**

Run:

```powershell
Invoke-RestMethod 'https://elm.cangdu.org/v2/index_entry'
Invoke-RestMethod 'https://elm.cangdu.org/shopping/restaurants?latitude=31.22967&longitude=121.4762&limit=1'
Invoke-RestMethod 'https://elm.cangdu.org/shopping/v2/menu?restaurant_id=1'
Invoke-RestMethod 'https://elm.cangdu.org/shopping/restaurant/1'
```

Expected:

- 分类返回数组。
- 商铺列表返回数组。
- 菜单返回数组。
- 商铺详情返回对象。

如果执行环境禁止网络，只记录“网络环境未验证”，不得用种子数据替代，也不得把冒烟未执行描述为成功。

- [ ] **Step 5: 最终提交检查**

Run:

```bash
git log -4 --oneline
git status --short
```

Expected: 能看到配置、上游客户端、Controller 切换三个功能提交；工作区只保留用户原有的无关修改，没有遗漏的本功能文件。
