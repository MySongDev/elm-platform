# 007 — apps/uni-user 工程约束与 Batch 0 实测结论

> **适用范围:** `apps/uni-user`（uni-app 微信小程序端）
> **状态:** Batch 0 骨架验证已完成（2026-09-28）
> **详细实测过程:** `docs/reports/2026-09-27-uniapp迁移方案/batch0-verification.md`
> ⚠️ 该报告目录被 `.gitignore:81` 忽略（仅本地），**本文是可进 git 的结论固化版**

本文件记录**必须遵守的版本/配置约束**与**已实测推翻方案文档的结论**。
每条都附实测依据，不接受「凭文档推断」。

---

## 一、版本约束（★ 违反会静默失败，不是报错）

### 1. `@dcloudio/*` 必须写精确完整版本号

```jsonc
"@dcloudio/uni-app": "3.0.0-5020620260917001"   // ❌ 不写 latest / ^ / "vue3" tag
```

**为什么**：实测 `@dcloudio/uni-app` 的 dist-tag `latest` = **`2.0.2-5020620260917001`**，
其 peerDependencies 含 **`@vue/composition-api: ^1.7.0`**（Vue 2 的 Composition API 回填补丁，
Vue 3 原生支持不需要它）→ **`latest` 指向的是活跃发版的 Vue 2 线**。

写成 `latest` 的后果：**能装上、能跑、看起来正常**，但运行时是 Vue 2 →
`<script setup>`、`defineProps`、`ref`/`computed` 行为异常，表现为白屏或数据不响应，**发现得很晚**。

另：`@dcloudio/vite-plugin-uni` 的 `latest` 指向 **2021 年的 alpha**（`3.0.0-alpha-3000020210521001`），
且它**完全没有 2.0.2 版本** → 两个包的 tag 语义不一致，靠 tag 必踩坑。

**8 个包必须同版本号**（实测全部存在）：`uni-app`、`uni-mp-weixin`、`uni-mp-vue`、
`uni-components`、`uni-i18n`、`uni-shared`、`vite-plugin-uni`、`uni-h5`。

**升级规则**：必须是专门的、有验证的动作（改完重跑 Batch 0 全部验证项），不能顺手 `pnpm update`。

### 2. `vue` 必须精确 `3.4.21`，不能写 `^3.4.21`

**实测**：`vue` 的 dist-tag `latest` = **3.5.43**，3.4.x 线最新为 3.4.38
→ `^3.4.21` **必然解析到 3.5.x**。

而 `@dcloudio/vite-plugin-uni` 的 dependencies 里**精确锁**：
```
@vue/compiler-core: 3.4.21    @vue/compiler-sfc: 3.4.21
@vue/compiler-dom:  3.4.21    @vue/shared:       3.4.21
```
运行时 vue 3.5.x + 编译器 3.4.21 会错配 → SFC 编译行为异常，难定位。

**验证方式**：`pnpm --filter @elm-platform/uni-user why vue` 必须输出 `vue@3.4.21`。
（Batch 0 已实测通过，全依赖树一致无分裂。）

### 3. ★ `pinia` 必须 `2.1.7`，**不能用 2.3.x**（迁移方案此处判断有误）

迁移方案 B 节写「`pinia: ^2.3.1`」，理由是「3.0.4 的 peer 要求 vue ^3.5.11」。**实测该理由不完整**：

| pinia | peerDependencies 对 vue | 与 vue 3.4.21 |
|---|---|---|
| 2.0.36 | `^2.6.14 \|\| ^3.2.0` | ✅ |
| **2.1.7** | **`^2.6.14 \|\| ^3.3.0`** | ✅ **← 2.x 里最高可用版，采用** |
| 2.2.8 | `^2.6.14 \|\| ^3.5.11` | ❌ **从这版起就冲突了** |
| 2.3.0 / 2.3.1 | `^2.7.0 \|\| ^3.5.11` | ❌ |
| 3.0.4 | `^3.5.11` | ❌ |

→ 方案「降到 2.x」的**方向对，版本号错**。`^2.3.1` 会产生 unmet peer。
已采用精确 `"pinia": "2.1.7"`（不带 `^`，避免解析到 2.2.x）。

**验证方式**：`pnpm peers check` 的输出里不应出现 pinia↔vue 冲突。
（Batch 0 实测：仅有与 uni-user 无关的 `@vueuse/core`（来自 web-admin）与 `postcss`（来自 tsup 链路）两项。）

### 4. `vite` 必须精确 `5.2.8`

`@dcloudio/vite-plugin-uni` 的 peerDependencies 是 **`"vite": "5.2.8"`（精确锁，非 range）**。

**连带约束**：
- ❌ **不能走根 catalog**（catalog 是 `vite: ^8.0.16`、`vue: ^3.5.26`）
- ❌ **不能复用 `packages/vite-config`**（它 devDependencies 依赖 catalog 的 Vite ^8）
- ⚠️ `vitest` 也必须降级：vitest 4.x 的 peer 是 `vite ^6||^7||^8` → 已采用 **`vitest 3.2.4`**（peer `^5||^6||^7`）

**由此产生的反直觉现象**：同一 monorepo 里有**两个 vue 版本**（web-user 3.5.x / uni-user 3.4.21）、
**两个 vite 版本**（8.0.16 / 5.2.8）、**两个 pinia 版本**（3.0.4 / 2.1.7）。
pnpm 各包独立 node_modules 可共存 —— **Batch 0 已实测：根 `pnpm build` 6/6 全绿**。

⚠️ **不要「顺手统一版本」**，那会直接搞坏 uni-app 工程。

### 5. `@dcloudio/uni-ui` 1.5.12 无 peerDependencies

实测 `peerDependencies` 为空 → 与 vue 3.4.21 无版本冲突（这是相对 wot-design-uni 的关键优势）。
easycom 路径实测存在：`lib/uni-icons/uni-icons.vue`、`lib/uni-popup/uni-popup.vue`。

### 6. `uni` CLI 由 `vite-plugin-uni` 提供，不是 `uni-app`

实测 `bin` 字段：`@dcloudio/vite-plugin-uni` → `{"uni": "bin/uni.js"}`；`@dcloudio/uni-app` 无 bin。
所以 `vite-plugin-uni` 必须在 **devDependencies**（否则 `uni build` 找不到命令）。

---

## 二、配置文件约束（★ 两个坑会让构建直接失败）

### 1. `apps/uni-user/package.json` **不能写 `"type": "module"`**

**症状**：
```
failed to load config from ...\apps\uni-user\vite.config.ts
uni is not a function
```

**根因**：`@dcloudio/vite-plugin-uni` 是 **CJS** 包（`type` 字段 undefined、无 `exports`、
`main: dist/index.js`，导出形式为 `exports.default = uniPlugin`）。
包声明 `"type": "module"` 后，Node 的 ESM↔CJS 互操作把整个 `module.exports` 当 default，
`import uni from '@dcloudio/vite-plugin-uni'` 拿到的是 `{ default: uniPlugin }` 而非函数。

⚠️ 这是从 web-user/web-admin 复制 package.json 时的**惯性写法**（那两个包都有 `"type": "module"`），
uni-app 官方 Vue3 模板不带。

### 2. SCSS partial **不能用 `_` 前缀命名**

**症状**：
```
Error: Cannot find module '...\src\assets\styles\mixins.scss'
  at Context.customResolver (@dcloudio/vite-plugin-uni/dist/config/resolve.js:36)
```

**根因**：uni-app 的 `customResolver` 用 `resolve.sync` 找**确切文件名**，
不认 Sass 的 `_mixins.scss` → `@use "mixins"` partial 约定。
web-user 能工作是因为它走 Vite 原生 sass 解析（`packages/vite-config` 的 `createScssOptions`）。

→ uni-user 侧命名为 `mixins.scss` / `variables.scss`（**无下划线**）。

### 3. SCSS 注入用 `@use` 而非 `@import`

```ts
additionalData: '@use "@/assets/styles/mixins.scss" as *; @use "@/assets/styles/variables.scss" as *;'
```
`@import` 在 Dart Sass 3.0 将移除，构建期已告警。与 web-user 的 `createScssOptions` 保持一致。

### 4. `vitest.config.ts` **必须独立**，不能复用 `vite.config.ts`

否则会触发 `@dcloudio/vite-plugin-uni` 的小程序编译流程
（实测输出「编译器版本：5.26（vue3）」「已开启 uni统计 2.0」），既拖慢又无必要。

且必须配 **`passWithNoTests: true`**：turbo 的 `test:unit` task 会自动纳入 uni-user
（方案议题 9 的「CI 无需改」结论实测成立），而测试文件要等各批次才搬入，
在此之前 vitest 默认 `No test files found, exiting with code 1` → **根 `pnpm test` 会红**。
依据 `AI_TEST_POLICY.md`「默认不加测试」。

`environment` 用 **`node`**（不是 happy-dom）：只搬端无关的纯逻辑测试，不需要 DOM。

---

## 三、后端图片代理（`GET /api/img/*`）

**为什么需要**：微信小程序 `<image>` 走 downloadFile 通道，同样受合法域名白名单约束，
而 `elm.cangdu.org` 是第三方域名无法 ICP 备案 → 必须自己后端中转字节流。
⚠️ **不能用 302 重定向**：重定向目标仍不在白名单内。

**对外契约 `/api/img/X` 一旦上线不再改**。将来图片字节本地化时只换 service 内部实现，前端零改动。

### ★ 坑 1：必须补回上游 `/img` 前缀（否则所有图片 404）

Express 4 的通配 `img/*` 只把 **`img/` 之后**的部分放进 `req.params[0]`。
实测：
```
https://elm.cangdu.org/img/164ad0b6a3917599.jpg  -> 200 image/jpeg  ✅
https://elm.cangdu.org/164ad0b6a3917599.jpg      -> 404 text/html   ❌
```
→ service 内必须 `const upstreamPath = \`${UPSTREAM_IMAGE_PREFIX}${path}\``（`UPSTREAM_IMAGE_PREFIX = '/img'`）。

用**模块常量**而非 config 项：`/img` 是上游的固定契约部分，不是部署可变量；
做成 config 会改变 `elmApi` 对象形状、牵动 config 测试，是无收益的 churn。

### ★ 坑 2：不能用 `@Header()` 装饰器设 Cache-Control（危害最大）

**实测**：`@Header('Cache-Control', 'public, max-age=31536000, immutable')` 会让
**404 响应也带上这个头**（`@Header()` 是静态元数据，Nest 在 handler 执行**之前**写入）。

⚠️ **后果**：一张图只要临时 404 一次（上游抖动、部署间隙），
**客户端会把这个 404 强缓存整整一年**，之后上游恢复也永远看不到（`immutable` 语义下连协商请求都不发）。
真机上极难排查。

→ **正确做法**：`@Res({ passthrough: true })` + 在**成功路径**上 `res.setHeader(...)`。
实测修后：成功带 `immutable` ✅，404 无 Cache-Control ✅。

### ★ 坑 3：Content-Type 必须运行时校验，不能只看 `response.ok`

**实测**：`elm.cangdu.org` 对**任何**未知路径返回 **200 + `text/html`**（SPA catch-all），不是 404。
```
GET https://elm.cangdu.org/img/evil.com/x -> 200 text/html
```
→ 若只判 `response.ok` 就转发，会把 HTML 错误页当图片发给客户端，
小程序端表现为「图片裂开」而 DevTools 里是 200。
已实现 `resolveContentType()` 拒绝非 `image/*` 响应。

⚠️ **也不能用 `path.extname()` 推断 Content-Type**：上游有两种路径形态，
`shop/15c1513a00615.jpg`（有点）与 `0e07558e305abfb2618ae760142222f9png`
（hash 后直接跟 png，**无点**）→ extname 对后者返回空字符串。优先透传上游的头。

### ★★ 坑 4：上游 Content-Type 本身可能是错的 —— 必须 magic bytes 嗅探

**实测**（2026-09-28，轮播图 CDN）：`fuss10.elemecdn.com/2/35/xxx.jpeg` 的字节是
**PNG**（magic `89504E47`），但响应头声称 `image/jpeg`。
→ 「优先透传上游头」这个原则**被上游自己打破**。已改为
**magic bytes 嗅探优先**（jpeg/png/webp/gif 四种），头与 magic 不一致时信 magic 并 warn。
实现：读首块 → 判定 → async generator 把首块与剩余块重组回流（保持流式，不缓冲整图）。

### ★★ 坑 5：存在**第二个第三方图片域名**（方案议题 2 的遗漏）

web-user `msite.vue:29` 硬编码 `https://fuss10.elemecdn.com` 拼轮播图
（`/v2/index_entry` 的 image_url 形如 `/2/35/xxx.jpeg`）。方案议题 2 只处理了
`elm.cangdu.org`，**漏了这个**。实测两域名不互通：
```
fuss10.elemecdn.com/2/35/xxx.jpeg   -> 200 image/jpeg(头错,实为 PNG)
elm.cangdu.org/img/2/35/xxx.jpeg    -> 404
```
→ 代理加了**前缀路由**（选它而非「逐个上游试到成功」：显式、无额外 404 往返、不破坏既有契约）：
- `GET /api/img/X` → `elm.cangdu.org/img/X`（默认路由，长期契约不变）
- `GET /api/img/cdn/X` → `fuss10.elemecdn.com/X`（**契约扩展**子路由）
前端用 `platform/image.ts` 的 `getCarouselImageUrl()`（拼 cdn 前缀）。
⚠️ 将来图片字节本地化时（议题 2 决策 3），**两条路由要一起换实现**。

### SSRF 防护：安全性是结构性的

`resolveUpstreamUrl()`（`modules/elm/utils/upstream-url.ts`，由 `elm-upstream.service.ts`
抽取，两个代理共用）拒绝协议相对路径、检查 `url.origin !== baseUrl.origin`。

**实测补充**：`/img/` 前缀本身构成更强的结构性约束 —— 前缀存在时，
`//evil.com/x`、`http://evil.com/x`、`../../etc/passwd` 解析结果的 origin **全部不变**：
```
prefix="img"  "//evil.com/x"      -> https://elm.cangdu.org/img/evil.com/x   SAFE
prefix="img"  "http://evil.com/x" -> https://elm.cangdu.org/img/http://...   SAFE
prefix="img"  "../../etc/passwd"  -> https://elm.cangdu.org/etc/passwd       SAFE
prefix=""     "//evil.com/x"      -> https://evil.com/x                      CROSS ← 仅无前缀时
```
`origin` 兜底检查保留作**纵深防御**（万一将来前缀改成空字符串，兜底立即生效）。

### 缓存策略：不留副本，纯流式转发

三层缓存模型里只做 L1（客户端）：
- ❌ 落盘：`render.yaml:8` `plan: free` 未配 disk，磁盘临时，重启即丢
- ❌ Redis：`RedisService.set` 只收 `string|number|object`（内部 JSON.stringify），
  不支持 Buffer；base64 会膨胀 33%；Render 托管 Redis 内存昂贵
- ✅ **纯转发 + `Cache-Control: immutable`**：上游本身是公网 CDN，
  而小程序端 `<image>` 有本地缓存 → 同一用户第二次看同一张图完全不请求后端

---

## 四、主包体积实测（★ 推翻方案估算）

方案议题 5 把「uni-app 运行时 + Vue 占 300-500 KB」列为最大不确定项。

**实测（空骨架 + 1 验证页 + uni-icons/uni-popup）：160.2 KB = 164,032 bytes，占 2MB 限制的 7.8%**

| 构成 | 体积 | 说明 |
|---|---|---|
| `common/vendor.js` | **79.6 KB** | ★ uni-app 运行时 + Vue 3.4.21 + pinia（含全部三方依赖） |
| `uni-icons.wxss` | 53.3 KB | ⚠️ iconfont 的 base64 字体内联在 CSS 里（单文件最大项） |
| 其余 | ~27 KB | uni-popup/uni-transition + 页面 + platform 层 |

**按类型**：`.js` 100.0 KB / `.wxss` 55.8 KB / `.wxml` 3.2 KB / `.json` 1.3 KB

→ **估算高估了 2-3 倍**，4 分包方案**不需要更激进**，主包余量约 1.86 MB。

⚠️ **新的体积注意点**：`uni-icons.wxss` 单文件 53.3 KB（uni-ui 把 ttf base64 内联进 CSS）。
与方案 H 节「41 个 svg 转 iconfont 10-30 KB」叠加后，图标总成本可能高于预期
→ Batch 1 第 8 项落地时要复测。

---

## 五、pnpm 供应链信任策略

`@dcloudio/vite-plugin-uni` 精确锁传递依赖 `@vitejs/plugin-legacy@5.3.2`，
首次 `pnpm install` 会被拦：
```
[ERR_PNPM_TRUST_DOWNGRADE] High-risk trust downgrade (possible package takeover)
```

**已核实为误报**（依据写在 `pnpm-workspace.yaml` 的 `trustPolicyExclude` 注释里）：
- `5.0.0-beta.0/beta.1`（2023-09）有 SLSA provenance，**其后 5.0.0-beta.2 至 5.4.3
  连续 10 个正式版全无** → Vite 官方短暂启用后停用，6.1.0 才重启，属发布流程变化
- `5.3.2` 的 maintainers 全为 Vite 官方成员（soda / vitebot / yyx990803 / patak / antfu）
- 包接管只影响单个版本，不会连续 10 个

**为什么没有「升级到同 major 有证据版本」这条退路**：5.x 全线无 attestation（5.4.3 也没有）；
6.x 有但需要 vite 6，与 uni-app 锁的 5.2.8 不兼容。

→ 已按仓库既有先例（`chokidar`/`semver`/`undici-types`）加入 `trustPolicyExclude`。

**`allowBuilds` 决策**（读了 postinstall 源码后判定）：
| 包 | 决定 | 依据 |
|---|---|---|
| `core-js` / `core-js-pure` | **false** | postinstall 只打印 OpenCollective 捐赠横幅，脚本自身检测 CI/ADBLOCK 即跳过 → 无功能作用 |
| `vue-demi` | **true** | postinstall 调 `switchVersion()` 切换 lib 产物指向 Vue2/Vue3 实现 → **有功能作用**，pinia 2.x 依赖它 |

---

## 六、开发命令

```bash
# 构建小程序（产物 dist/build/mp-weixin，用微信开发者工具「导入项目」打开）
pnpm --filter @elm-platform/uni-user run build

# 开发模式
pnpm --filter @elm-platform/uni-user run dev:mp-weixin

# 后端（脚本名是 dev：nest start --watch）
pnpm --filter @elm-platform/server run dev
```

⚠️ **不要把 `nest start --watch` 与 `nest build` 并行跑**：两者争用 `dist/`，
build 重写产物时 watch 进程重启会报 `Cannot find module '...\dist\main'`（实测踩过）。
需要同时用后端与重新构建时，后端用 `pnpm run start`（非 watch）。

⚠️ **本机跑后端测试会 OOM**：jest 未配 `maxWorkers`，默认 `ncpu-1` 个 worker 各自跑 ts-jest。
```bash
# 症状：Test Suites: 0 of 37 total + JavaScript heap out of memory（不是断言失败）
cd apps/server && NODE_OPTIONS=--max-old-space-size=4096 pnpm exec jest --maxWorkers=2
```

---

## 七、与 web-user 的关系

**长期并存**（迁移方案议题 9 决策）：web-user 是**在跑的生产资产**
（GitHub Pages + Linux 两条部署路径），不是开发产物。所有迁移改动只发生在
`apps/uni-user` 和 `apps/server`，**web-user 全程不动**。

**同源资产需双修**（约 344 行，均为低变更频率）：
| 资产 | 行数 | 说明 |
|---|---|---|
| `services/api/endpoints/*` | 48 | 端点常量 |
| `utils/format/format.js` | 16 | 格式化 |
| `services/http/policies/*` | 90 | 请求策略（`error-message.js` 已改 `setAlertHandler()` 注入 → 端无关）。⚠️ **该行的「双修」约定自 2026-10-02 起作废**——web-user 侧已剔除三段策略、只留 `useLocation`，两处属**有意分叉**，见第十二节 |
| `utils/cart.ts` | 198 | `getImageUrl` 改依赖注入 |

复制过来的文件头需标注同源，格式：
```js
// ⚠️ 与 apps/web-user/src/services/api/endpoints/payment.endpoints.js 同源
// 修改需同步两处。不抽共享包的原因见迁移方案议题 7。
```

**明确不共享**：样式文件（px→rpx 后会与 web-user 分叉）。
端无关的只有 web-user 侧 `_variables.scss` 的 4 个颜色变量与 `_mixins.scss`（实测不含任何 px/vw 字面量）；
搬到 uni-user 后**文件名去掉 `_` 前缀**（见「二、2」），内容保持一致。

**`@elm-platform/contracts`**：uni-user 引入它替掉 order/payment 的 10 处硬编码状态字面量。
⚠️ 该包的 `exports.import` 曾指向不存在的 `.mjs`（已修，见下节）。

---

## 八、Batch 0 顺带修掉的存量缺陷

### `packages/contracts` 的 ESM 导出指向不存在的文件

```jsonc
// 修前（❌ tsup 在 "type": "module" 包下产出的是 .js，不是 .mjs）
"import": "./dist/index.mjs",
"import": "./dist/order/index.mjs",
// 修后
"import": "./dist/index.js",
"import": "./dist/order/index.js",
```
实际产物：`dist/index.cjs`、`dist/index.d.cts`、`dist/index.d.ts`、**`dist/index.js`**

**为什么至今没暴露**：现有两个消费方都绕开了 `import` 条件
- `apps/server/.../order.types.ts:13,24` —— server 是 CJS 构建，走 `require` 条件（`.cjs` 存在）
- `apps/web-admin/.../model/types.ts:9` —— `import type {...}`，走 `types` 条件，
  **运行时完全擦除**，打包器不解析 JS 文件

uni-user 要 import **运行时常量值**（`paymentStatuses.includes(...)`），
是第一个真正走 `import` 条件的消费方。

**修后实测**：`node esm-probe.mjs` → `ESM OK -> ["PENDING","PAID","CLOSED"]`；
构建产物中常量正确内联进 `common/vendor.js`（无外部 require 残留）。
**未影响 server / web-admin**：`require`/`types` 条件未动，根 `pnpm build` 6/6 全绿、
后端 37 suites / 513 tests 全绿已回归验证。

---

## 九、其他顺带发现（不在迁移范围）

| # | 问题 | 证据 |
|---|---|---|
| Y1 | ~~CLAUDE.md 的后端命令 `start:dev` 不存在~~ **已修复（2026-09-29）** | `apps/server/package.json` 实际脚本是 `dev`（`nest start --watch`）；`pnpm run start:dev` → `ERR_PNPM_NO_SCRIPT`。CLAUDE.md / AGENTS.md / 本文档的命令已统一改为 `run dev` |
| Y2 | seed 数据的图片路径在上游已失效 | `elm.seed.ts:28,44,60` 的 `shop/15c1513a00615.jpg` 等三个，实测上游 `/img/shop/xxx` 与 `/shop/xxx` **都是 404**；而 `DEFAULT_RESTAURANT_IMAGE` 用的 `187bcca1ec6114376.jpg`（**不带 `shop/`**）实测 **200，5399 bytes** → seed 里的 `shop/` 前缀是多余/过期的 |
| Y3 | 后端测试基线 519 → **513** | 差额 6 个已核实：`e3b1dd4`（移除无调用方的注册接口）删了 customer-auth 的 2 个 `it()` + swagger coverage 的 1 个 `controllerEntries` 条目（该 spec 用 `describe.each`，被删条目 `errors: [400,409,500]` → 1+3=4 个 test）。2+4=6 ✓ **是该提交的合理产物** |

---

## 十、Batch 0 结论

✅ **可进入 Batch 0.5（shop 滚动 PoC）与 Batch 1（基础设施）**。无推翻方案主体设计的阻塞项。

**11 项验证状态**：6 项已通过（0/2/3/6/9/11）+ 第 8 项后端侧端到端通过；
**5 项必须在微信开发者工具/真机人工确认**（1 渲染 / 4 请求 / 5 abort / 7 连本地后端 / 10 `new URL()`）。

⚠️ 无法自动化的根本原因：这 5 项依赖微信小程序运行时（`wx.request`、小程序的 `URL` 实现、
开发者工具的域名校验开关、`<image>` 渲染）。**构建能过 ≠ 运行时行为正确**，尤其第 10 项。

验证页 `apps/uni-user/src/pages/index/index.vue` 上已备好按钮，
点完屏上直接出结论（`src/pages/index/probes.ts` 定义了 12 项判定逻辑）。

---

## 十一、Batch 1 进度（2026-09-28）

| # | 项 | 状态 | 说明 |
|---|---|---|---|
| 1 | 后端图片代理 `GET /api/img/*` | ✅ **完成并端到端验证** | 见第三节；修了两个方案未预见的 bug（前缀映射 / `@Header` 污染 404） |
| 2 | `platform/storage.ts` + 改造 3 个文件 | ✅ **完成** | `SearchHistory.js`/`FormDraft.js` 改走封装（原直接用 localStorage，小程序端会 ReferenceError） |
| 3 | `transport.ts` + 重写 `request.js` | ✅ **完成** | 含 query 序列化（uni.request 不自动拼 GET 参数）、超时识别（errMsg 含 timeout） |
| 4 | `config/index.ts` 域名配置化 | ✅ **完成** | `ELM_ASSET_HOST` 默认跟随 `API_BASE_URL`；`IMAGE_ORIGIN_FALLBACKS` 清空 |
| 5 | `pages.json` 17 页 + 分包 + tabBar + `routes.ts` | ✅ **完成** | 4 分包 + preloadRule 构建产物验证生效；tabBar 8 张 PNG 已生成 |
| 6 | `platform/navigation.ts` 拦截器 + 鉴权 | ✅ **完成** | 实测修正方案 E 节误判：需鉴权的 9 页**无一是 tabBar 页** |
| 7 | `platform/feedback.ts` | ✅ **完成** | loading 用引用计数；confirm 失败时 resolve(false) 防危险操作误执行 |
| 8 | 图标方案（iconfont + tabBar PNG） | ✅ **完成** | 38 单色转字体（ttf base64 内联 css）、3 多色 PNG 兜底、8 张 tabBar PNG |
| 9 | 样式 codemod | 🔄 **子代理进行中** | 脚本 + 8 类边界验证（会话中断过一次，已恢复续跑） |
| 10 | pinia 2.x + store-cart 手动持久化 | ✅ **完成** | key 升 v3、deep watch 覆盖 12 个变更入口、pendingMeta(Map) 不持久化 |
| 11 | 后端拆建单端点 | ✅ **完成** | `POST /api/orders` 只建 PENDING 单不绑渠道；userId 取自 token 防伪造；金额不变量在 order-draft.factory 收敛；web-user 零改动；测试 37/513→38/524 全绿 |
| 12 | `platform/payment.ts` L2 接缝 + 清 axios | ✅ **完成** | `:36` 的 isAxiosError 陷阱改为 `instanceof TransportError` + `isNetworkError` 判定 |
| 13 | `error-message.js` 解耦 showAlert | ✅ **完成** | `setAlertHandler()` 注入；main.ts 接线 |
| 14 | 引入 contracts 替 10 处硬编码 | ⏳ **Batch 3 落实** | 依赖已装且 Batch 0 第 11 项已验；10 处在 order/payment 页，Batch 3 复制时改 |
| 15 | 复制端无关资产 + 同源标注 | ✅ **完成** | endpoints 8 文件 / policies 5 文件 / cart.ts(getImageUrl 改注入) / stores 4 个 |
| 16 | 协作配套 | ✅ **完成** | README + CODEOWNERS + 2 个 ISSUE_TEMPLATE + CI 版本检查脚本（10 类违规实测全抓到） |

### Batch 0.5 — shop 滚动 PoC（代码就绪，⚠️ 结论待人工实测）

PoC 页 `apps/uni-user/src/pages/poc-shop/poc-shop.vue`（已注册进 pages.json 主包）+
测量指南 `docs/reports/2026-09-27-uniapp迁移方案/batch05-poc-measure.md`。

页面自带：方案 A（三层 sticky）/ 方案 B（固定布局）切换、批量锚点查询 + 缓存二分的
双向联动、rpx→px 系数打印、`calc(100vh - 300rpx)` 混合单位探针、
`@media (width <= 360px)` 断点探针、三层吸顶 top 测量按钮。

⚠️ **A1-A6（sticky 生效性/手势冲突/遮挡）与 B2（视觉降级）必须在微信开发者工具 + 真机实测**，
纸面与构建都无法判断。验完按指南模板回填结论，然后**删除 PoC 页与 pages.json 注册**。

### Batch 2 — 公共组件（✅ 7 项全部完成，2026-09-28）

| # | 组件 | 处置 |
|---|---|---|
| 1 | BaseState / StarRating / Loading / LocalLoading | ✅ 迁移。van-loading → 纯 CSS spinner |
| 2 | ConfirmDialog / AlterTip | ✅ **不迁组件**，由 platform/feedback.ts 的 uni.showModal/showToast 替代（方案 E 节推荐第 2 选择）。代价：自定义弹窗视觉降级为原生 modal |
| 3 | ShopList / ShopItem | ✅ 迁移。⚠️ BackTop 不再内嵌（小程序无 Teleport），改由页面挂载 |
| 4 | Skeleton / ShopListSkeleton | ✅ 迁移。③ 类模板属性 px→rpx 的 7 处手工转换在此 |
| 5 | head.vue | ✅ 迁移。noBackPages 去掉死链 `/home`，换 tabBar 路径 |
| 6 | BackTop | ✅ 重写为「纯展示+事件」：240 行 useBackTop.ts（重度 DOM）整体作废 |
| 7 | SmartImage 三件套 | ✅ 按 D3 退化方案重写：`<image lazy-load>` + 并发调度；视口优先级废弃 |

**组件层新发现的坑**（补充到「新发现的坑」清单）：

10. **`useTemplateRef` 是 Vue 3.5 API** —— uni-user 锁 vue 3.4.21，不存在。
    web-user 的 StarRating/SmartImage 都用了它 → 迁移时必须换 `ref` + 模板 ref。
11. **`<image>` 组件无 `alt` 属性**（HTML 专属）→ 无障碍语义用 `aria-label`。
12. **小程序无 `Teleport`** → web-user ShopList 的 `<Teleport to="body">` 挂 BackTop 模式作废。
13. **`useInfiniteScroll` 的 IntersectionObserver → scroll-view 的 `@scrolltolower`**：
    更可靠（平台自己算触底）但**失去 rootMargin 提前量**，由 scroll-view 的
    `lower-threshold` 补偿；且 scrolltolower 连续触发需自己加冷却（web-user 靠
    isIntersecting 边沿天然去重）。
14. **`image` 组件无 alt / `new Image()` 不存在** → 调度器的 preloadImageUrl 删除
    （实测业务零调用，仅自身测试调用）。
15. **easycom autoscan 只认 `components/组件名/组件名.vue`** → BaseState/StarRating/
    LocalLoading/BackTop/head 等嵌套或非同名路径**不会自动导入**，
    已在 pages.json 的 easycom.custom 补 3 条映射（其余靠显式 import）。
16. **web-user 靠 unplugin-auto-import 注入 `storeToRefs` 等** → uni-user 没配该插件，
    所有 vue/pinia API 必须显式 import（head.vue 第一版漏了 storeToRefs）。

### 会话中断恢复记录（2026-09-28）

本次实施跨了一次会话中断，恢复时核实并处理了：
1. **残留进程**：上次后台任务的 `nest start --watch` 与 `nest start` 子进程存活
   （watch 占 dist、旧 server 占 3000 端口）→ 已 taskkill 清理，端口释放后重启最新后端
2. **codemod 子代理成果未落盘**（`px-to-rpx.mjs` 不存在）→ 已 SendMessage 恢复续跑
3. **我中断前留下的损坏引用**：`elm-image-proxy.service.ts` 合并 import 后函数体仍用
   `NodeReadable` → 已修为 `Readable`，后端 lint + build 复验通过
4. **`pnpm-workspace.yaml` 的 `ttf2woff2` 占位符**：后端子代理已删（核实过它只删了这一行）；
   我的 allowBuilds 决策（core-js false / vue-demi true）保留
5. **api-types stale**：子代理报告属实（committed openapi.json 连 `/api/img` 都没有）→
   已重启后端并 `pnpm api:generate` 重新生成（+422 行，含 `ElmImageProxyController_proxyImage`
   与 `OrderController_createOrder`），CI 的 api-drift 恢复绿
6. **全量回归**：build 6/6；server 38/524、web-admin 44/175、web-user 18/78、uni-user exit 0
   ⚠️ 并行跑会 OOM（turbo 同时起 4 包测试），**串行**跑全过 —— 与代码无关

### Batch 1 过程中新发现的坑（方案未预见）

1. **`uni.request` 不支持 PATCH** —— type-check 抓出。web-user 的 `patch()` 零调用方、
   后端用户端零 `@Patch` → 无实际影响，但 uni-user 的 transport 直接不提供该方法
   （留一个会静默失败的方法更糟）。
2. **`uni.request` 不自动序列化 GET 的 query 参数** —— axios 会，uni 不会。
   不自己实现 serializeQuery，所有带参 GET 都会**静默丢参数**（数据不对但不报错）。
3. **小程序端没有 `FormData`** —— `policies/meta.js` 的 `value instanceof FormData`
   会 ReferenceError。加 `typeof FormData !== 'undefined'` 保护。
4. **`store-loading` 的 delay/minDuration 默认值（220/300）不能丢** ——
   我第一版内联实现写成 0，快请求会闪遮罩。已改回复制 store-loading（同源）+ 注入回调。
5. **`@dcloudio/uni-ui` 不属于日期戳版本家族** —— CI 校验脚本第一版误报它
   （`^1.5.12` 是正常 semver）。豁免集已加 `types` + `uni-ui` 两个。
6. **svgtofont 的 `useNameAsUnicode: true` 会吞掉全部图标 css 类** ——
   类生成逻辑在 else 分支。且 `generateFonts` 选项名不存在（被静默忽略），
   正确的是 `excludeFormat` 数组。
7. **微信小程序 `@font-face` 不支持本地文件路径** —— 只认 base64 或网络 URL。
   ttf 必须 base64 内联进 css，否则图标全不显示且无报错。
8. **web-user 的 msite tab 两态形状不同** —— `footGuide.vue:14` 是
   `active ? 'eleme' : 'download'`。tabBar 生成脚本若两态同用 eleme.svg，
   未选中会变成实心灰方块。已按态取不同源 svg。
9. **`multicolor` prop 在 web-user 零调用方** —— 唯一多色图标 fengniao 以单色模式调用，
   但实际渲染多色（svg 内部 fill 优先级高于外层）。SvgIcon 必须按
   「图标本身是否多色」判断兜底，不能按 prop。

### Batch 3 过程中新发现的坑（2026-09-28，SvgIcon 样式机制）

17. **★ SvgIcon 的调用方样式契约：尺寸走「标签级 class + font-size」，颜色走 `color` prop，
    `icon-class` 一律不能承载样式**

    **失效机制（编译产物坐实，不是推测）**，两道独立的墙：

    1. **scope id 只在宿主标签上**。`ProfileCard.wxml` 编译产物是
       `<svg-icon class="data-v-20b90bf1" u-p="{{f}}"/>`，而 `icon-class` 经 `u-p`(props)
       进组件、落在 `SvgIcon.wxml` 的内部 `<text class="{{d}}">` 上。调用方 scoped 规则
       编译成 `.profile-card_desc .icon_mobile.data-v-20b90bf1{...}` —— 内部节点**没有**
       这个 scope id，选择器永远匹配不上。
    2. **自定义组件默认样式隔离**。`SvgIcon.json` 只有 `{"component":true}`，
       无 `styleIsolation` 字段 → 微信默认 `isolated`。

    两道墙都不报错：`vue-tsc --noEmit` EXIT=0、`uni build` EXIT=0，图标只是尺寸/间距静默走样。

    **生效机制**：标签级 `class` 落在宿主节点，宿主节点属于**调用方自己的渲染树**并带调用方
    scope id → 调用方 scoped 规则能命中；`font-size` 再按 CSS 继承进组件内部节点。
    SvgIcon 两个分支都是 1em（字体分支 `.icon`、PNG 分支 `.svg-icon-png`），
    所以**宿主节点的 font-size 就是图标边长**。既存先例：
    `CartStoreCard.vue:133 .store-arrow{font-size:32rpx}`、
    `BackTop.vue:97 .back-top-icon{font-size:40rpx}`、`StarRating.vue:74,96`。

    **⚠️ 无效修法（两个都曾被子代理/上个窗口提出，均已否决）**：
    - 在调用方 scss 里给 `icon-class` 传的类补样式 —— 同样穿不进去，白改。
    - `virtualHost: true` + manifest 开 `mergeVirtualHostAttributes` —— 见下条。

18. **为什么否决 `virtualHost` 治本方案（三条硬理由，均有源码/产物依据）**

    1. **修不了真正的病**。web-user 的 `.icon_mobile{width:10px;height:16px}`、
       `.svg{width:5.6vw;height:16px}` 是 `<svg>` 盒子语义；小程序端图标是 **iconfont 字形**，
       字形大小只由 `font-size` 决定，`width/height` 改不了字形。
       即使样式穿透打通，写 `width/height` 仍然无效 → 穿透不是根因。
    2. **会打破当前唯一能工作的写法**。`virtualHost` 让宿主节点消失、外部 class 合并进内部节点，
       于是 `store-arrow`/`back-top-icon` 这类**标签级 class** 也要靠样式穿透才生效；
       而 `styleIsolation` 要生效还得每个父组件单独开 `shared`（父是组件不是页面，
       `apply-shared` 只放页面 wxss 进来）。全局改动 + 逐调用方回归，风险远大于收益。
    3. **平台细节未验证**：`uni-mp-vite/dist/plugins/entry.js:143-149` 明确 —— mp-weixin 下
       只有 `manifest.json` 配了 `mp-weixin.styleIsolation` 才会静态写进组件 json，
       否则只能靠运行时 `options`（`uni-mp-weixin/dist/uni.mp.esm.js:741-756`，
       默认 `addGlobalClass: true`、`styleIsolation` 那行是**注释掉的**）。
       要走这条路必须动全局 manifest，属「版本/工程配置」级改动。

    → 结论：**不动 SvgIcon 运行时行为、不动 manifest**，只把调用方写法纠正到生效机制上。
    修复后 `ProfileCard.wxml` = `<svg-icon class="icon_mobile data-v-c47ec2bd">`，
    与 `.profile-card_desc .icon_mobile.data-v-c47ec2bd{...}` **精确匹配**（产物已核对）。

19. **字体图标无法复现 web-user 的非正方形宽高比** —— iconfont 字形是正方形栅格。
    web-user `.icon_mobile` 的 10×16 瘦长比例（SVG viewBox 决定）在小程序端只能按**高度**取
    `font-size`，宽度会偏大。迁移时统一按「取 web-user 的 height 作为 font-size」换算，
    宽高比差异列入真机目视验收项。

20. **`head.vue` 当前零引用** —— 全仓 grep `header/head|HeadTop` 只命中它自己的注释，
    且 `dist/build/mp-weixin` 里搜不到 `left_area` → Batch 2 迁移好的 head 组件
    **还没被任何页面接入**（easycom autoscan 也不认 `components/header/head.vue` 这种非同名路径，
    见坑 15）。它的样式修复无法用 build 产物核对，接入页面后才能验收。

21. **★ `v-show` 在「组件根节点自带 `display:flex/grid`」时静默失效** —— 根因是 CSS 权重，不是渲染 bug：
    `v-show` 被 uni-app 降级为 `hidden` 属性，底层是低权重的全局选择器
    `wx-view[hidden]{display:none}`；组件自己的 `.back-top{display:flex}`（`BackTop.vue:82`）
    **覆盖**了它 → `hidden="true"` 也照样显示（产物 `BackTop.wxml:1` 是 `hidden="{{!b}}"`）。
    表现：msite 未滚动时 BackTop 圆圈一直显示。
    **修正（按推荐度）**：① `v-if`（销毁/重建最可靠，可写子组件根或**上提父组件**
    `<BackTop v-if="scrollTop>400">`）；② 保留 `v-show` 时补 `.back-top[hidden]{display:none !important}`；
    ③ 不用 hidden，改 `opacity:0 + pointer-events:none`（保留 flex 居中 + 白捡淡入淡出动画）。
    ⚠️ 「改用 v-show」**不是**解法——v-show 正是病根。
    详见 `uniapp-migration-diffs.md` 第 10.1 节。

---

## 十二、待办：uni-user HTTP 层的未接入策略（缓存 / 去重 / 重试）

> 记录于 2026-10-02。**这不是缺陷，是「有实现、无调用方」的死代码待决策项**，不阻塞任何批次。

### 现状

`apps/uni-user/src/services/http/request.js:36-180` 存在 cache / dedupe / retry 三段策略的**平台适配版**实现，`policies/index.js` 也全量 re-export。但排查确认**零调用方**：

```bash
# 排除 http/ 目录后，uni-user/src 内没有任何策略开关传参
Grep pattern: \b(retry|dedupe|dedupeKey|cache|cacheMaxAge)\b\s*:
# 仅命中无关项：useLoadMore.ts 自身的 retry: () => Promise<void>、store-locations 的 useLocationStore
```

起点是 web-user 侧的同名排查：那里三段策略同样零调用方，已于 2026-10-02 从主链路剔除并留档——代码在 `apps/web-user/src/services/http/extras/optional-policies.js`（**未接入**），启用指南在 `docs/engineering/010-http-optional-policies.md`。

### ★ 为什么 uni-user 不能照搬 web-user 的删法

它与 web-user 那份「原封未动的拷贝」性质不同，是迁移时**刻意做过平台适配**的：

| 差异点 | web-user 原版 | uni-user 适配版 | 依据 |
|---|---|---|---|
| 错误判定 | axios 的 `ECONNABORTED` / `ERR_NETWORK` / `error.response.status` | `error instanceof TransportError` + `isTimeout` / `isNetworkError` / `.status` | `request.js:184-192`，注释明写「判定依据换成 transport 的统一错误结构」 |
| 定位注入 | 同步读 store 缓存坐标 | **async**，无缓存坐标时发起一次异步定位并等待 | `request.js:207-214`，小程序 `uni.getLocation` 是异步的 |
| 取消语义 | 自己 `new AbortController()` 并接管 `config.signal` | 走 transport 的 `signal → RequestTask.abort()` 映射 | `request.js:125-128`，注释标为「与 web-user 的差异」 |
| 运行时依赖 | 无 | **入口注册 `AbortController` 垫片** | `main.ts:15`「否则 useLoadMore/请求去重的 `new AbortController()` 会在页面里抛 ReferenceError」 |

三条不照搬的理由：

1. **迁移未完成**（Batch 3 进行中），此刻动 HTTP 层会与页面迁移交叉；
2. 这些差异是**平台强制**的，删掉等于把平台适配知识一起丢掉；
3. ★ **垫片还被 `useLoadMore` 依赖**（它同样 `new AbortController()`），去重只是受益方之一，**不能连坐清理** `platform/polyfills.ts`。

### 处置选项（待定，当前不改）

| 选项 | 做法 | 代价 |
|---|---|---|
| A. 保持现状 | 留着不接 | 与 web-user 一样属「预埋死代码」，但已被刻意维护过，不算纯负担 |
| B. 与 web-user 对齐留档 | 迁到 `services/http/extras/`、主链路剔除、`policies/index.js` 只留 `useLocation` | 需同步改 `main.ts:15` 垫片注释里对「请求去重」的引用（**垫片本身要留**） |
| C. 真正接入 | 在需要的接口上开 `cache` / `retry` | 必须先解决 web-user 侧暴露的「缓存 key 不含定位头 → 换城市仍返回旧位置数据」问题（见 `010` 文档坑 1）；本端定位是异步的，缓存失效时机更复杂 |

**结论：等 Batch 3 页面迁移收尾后，与「是否接入」一起决策。**

### 连带：第七节的同源「双修」约定对该文件已失效

第七节表格把 `services/http/policies/*` 列为「需双修」资产。自 2026-10-02 起 web-user 侧已**有意分叉**（剔除三段策略、`policies/index.js` 只留 `useLocation` 导出），该行不再适用「修改需同步两处」。
`apps/uni-user/src/services/http/policies/index.js` 的文件头注释已同步改写为「同源，但已分叉，修改需自行判断是否要同步」——与第七节给的标注模板不一致处，以该文件注释为准。
