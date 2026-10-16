/**
 * 生成 17 个页面的占位文件（Batch 1 第 5 项：锁定分包结构）。
 *
 * 为什么需要：pages.json 已声明全部页面与分包归属，但页面内容要到 Batch 3 才迁移。
 * 分包结构必须现在就锁定（迁移方案议题 5：「后改要动所有跳转路径」），
 * 所以先建带标注的占位页，让构建能通过、分包能被验证。
 *
 * ⚠️ 一次性脚本，跑完即弃。每个占位页都标注了：
 *   - 对应 web-user 的源文件（迁移时的输入）
 *   - 属于哪个 Batch（何时被真实实现替换）
 *   - 是否需要 requiresAuth（与 config/routes.ts 保持一致）
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC_ROOT = fileURLToPath(new URL('../src', import.meta.url))

/** [uni 路径（相对 src，不带 .vue）, web-user 源文件, 批次, 是否需登录, 页面标题] */
const PAGES = [
  // ── 主包：tabBar 四页 ──
  ['pages/msite/msite', 'views/msite/msite.vue', 'Batch 3（2 天）', false, '外卖'],
  ['pages/search/SearchHome', 'views/search/SearchHome.vue', 'Batch 3（2 天）', false, '搜索'],
  ['pages/cart/cart', 'views/cart/cart.vue', 'Batch 3（3 天）', false, '购物车'],
  ['pages/profile/profile', 'views/profile/profile.vue', 'Batch 3（4 天）', false, '我的'],
  ['pages/error/404', 'views/error/404.vue', 'Batch 3（1 天）', false, '404'],

  // ── pkg-shop ──
  ['pkg-shop/shop', 'views/shop/shop.vue', 'Batch 3 最后一批（8-12 天，最难）', true, '商家'],

  // ── pkg-order ──
  ['pkg-order/order', 'views/order/order.vue', 'Batch 3（3 天）', true, '我的订单'],
  ['pkg-order/payment', 'views/payment/payment.vue', 'Batch 3 留桩（2 天）', true, '在线支付'],
  ['pkg-order/PaymentResult', 'views/payment/PaymentResult.vue', 'Batch 3 留桩（2 天）', true, '支付结果'],

  // ── pkg-profile ──
  ['pkg-profile/info', 'views/profile/info/info.vue', 'Batch 3（含在 profile 4 天内）', true, '账户信息'],
  ['pkg-profile/setusername', 'views/profile/info/setusername.vue', 'Batch 3（同上）', true, '修改用户名'],
  ['pkg-profile/addressHome', 'views/profile/address/addressHome.vue', 'Batch 3（同上）', true, '收货地址'],
  ['pkg-profile/AddressAdd', 'views/profile/address/add/AddressAdd.vue', 'Batch 3（同上）★ 含 area-data 155.3 KB', true, '添加地址'],
  ['pkg-profile/AddressDatil', 'views/profile/address/add/AddressDatil.vue', 'Batch 3（同上）', true, '地址详情'],

  // ── pkg-auth ──
  ['pkg-auth/login', 'views/login/login.vue', 'Batch 3 留桩（2 天）', false, '登录'],
  ['pkg-auth/SmsVerification', 'views/login/SmsVerification.vue', 'Batch 3 留桩（2 天）', false, '短信验证码'],
  ['pkg-auth/forget', 'views/forget/forget.vue', 'Batch 3（1 天）', false, '忘记密码'],
]

function buildPlaceholder([routePath, sourceFile, batch, needsAuth, title]) {
  const subPackage = routePath.startsWith('pages/') ? '主包' : routePath.split('/')[0]
  const pageName = routePath.split('/').pop()

  // import 分组：外部包在前、内部别名在后（perfectionist/sort-imports）；
  // ⚠️ @dcloudio/uni-app 必须只出现一条（分两条会触发 import/no-duplicates）。
  const imports = [
    needsAuth
      ? `import { onLoad, onShow } from '@dcloudio/uni-app'`
      : `import { onLoad } from '@dcloudio/uni-app'`,
    `import { ref } from 'vue'`,
  ]
  if (needsAuth) {
    imports.push(`import { createAuthGuard } from '@/platform/navigation'`)
  }

  // script 块正文：import 后留一个空行（import/newline-after-import），
  // 结尾不留多余空行（vue/block-tag-newline 要求 </script> 前恰好 1 个换行）。
  const body = [`const routePath = ref('/${routePath}')`, '']
  body.push('onLoad((options) => {', `  console.log('[${pageName}] onLoad', options)`, '})')
  if (needsAuth) {
    body.push(
      '',
      '// 鉴权兜底：tabBar 页不可拦截 switchTab，故用 onShow 而非 onLoad（迁移方案 E 节）',
      `onShow(createAuthGuard('/${routePath}'))`,
    )
  }

  const script = [
    '<script setup lang="ts">',
    '/**',
    ' * ⚠️ 占位页 —— 尚未实现',
    ' *',
    ` * 迁移来源: apps/web-user/src/${sourceFile}`,
    ` * 实现批次: ${batch}`,
    ` * 分包归属: ${subPackage}`,
    ` * 需要登录: ${needsAuth ? '是（见 config/routes.ts 的 REQUIRES_AUTH_PAGES）' : '否'}`,
    ' *',
    ' * 本文件由 scripts/generate-page-placeholders.mjs 生成，用于在 Batch 1 锁定分包结构。',
    ' * Batch 3 迁移该页时**整体替换本文件内容**。',
    ' */',
    ...imports,
    '',
    ...body,
    '</script>',
  ].join('\n')

  return `${script}

<template>
  <view class="placeholder">
    <view class="placeholder-title">
      ${title}
    </view>
    <view class="placeholder-path">
      {{ routePath }}
    </view>
    <view class="placeholder-note">
      占位页 · 待 ${batch} 实现
    </view>
    <view class="placeholder-source">
      源: apps/web-user/src/${sourceFile}
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 占位页样式。⚠️ 单位用 rpx（375 基准，1px = 2rpx） */
.placeholder {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 48rpx 32rpx;
  box-sizing: border-box;
}

.placeholder-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
}

.placeholder-path {
  padding: 8rpx 24rpx;
  font-size: 24rpx;
  color: $blue;
  background: rgb(49 144 232 / 10%);
  border-radius: 8rpx;
}

.placeholder-note {
  font-size: 26rpx;
  color: #ff976a;
}

.placeholder-source {
  font-size: 20rpx;
  color: #999;
  word-break: break-all;
}
</style>
`
}

let created = 0
const skipped = 0

for (const entry of PAGES) {
  const target = join(SRC_ROOT, `${entry[0]}.vue`)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, buildPlaceholder(entry), 'utf8')
  created += 1
}

console.log(`生成占位页 ${created} 个，跳过 ${skipped} 个`)
console.log('分包归属:')
for (const entry of PAGES) {
  const pkg = entry[0].startsWith('pages/') ? '(主包)' : entry[0].split('/')[0]
  console.log(`  ${pkg.padEnd(14)} ${entry[0]}`)
}
