// ⚠️ 与 apps/web-user/src/config/profileConfig.js 同源改造。
//
// ★★ 存量死链处置（方案 D2 / K 节 X3，已决策：保留视觉完整性，置灰 + toast「敬请期待」）：
// web-user 的 PROFILE_ASSETS 有 5 个路由在 router/modules 下**完全没有定义**
// （/balance /benefit /points /vipcard /service），H5 点了被 router/index.ts 的
// `/:pathMatch(.*)*` → /404 兜住；小程序端**没有 404 兜底路由机制**，照搬会直接报错 → 加 disabled 标志。
//
// ⚠️ `/download`（下载饿了么 APP）**与上述 5 个不同**：它在 web-user 里是有定义、有页面的
// （router/modules/download.ts → views/download/download.vue）。本端是**刻意裁剪**（非死链）：
// 小程序内提供「下载 App」入口语义不成立且是审核风险点（方案 D2 建议处置）→ 属已知功能缺失，不是技术限制。
//
// ★ 路由换成 uni-user 的分包路径（ROUTES 常量，单一真源）。

import { ROUTES } from './routes'

export const THEME_MAP = {
  primary: '#4aa5f0',
  warning: '#ff9900',
  danger: '#ff5f3e',
  success: '#6ac20b',
  vip: '#ffc636',
}

export const profileCardConfig = {
  guest: {
    name: '去登录',
    desc: '暂无绑定手机号',
    mobileIcon: 'mobile',
  },
  loggedIn: {
    desc: '',
    mobileIcon: 'mobile',
  },
  arrowIcon: 'arrow-right',
}

export const PROFILE_ASSETS = {
  info: [
    {
      key: 'balance',
      route: '',
      unit: '元',
      label: '我的余额',
      theme: 'warning',
      // ★ 存量死链：页面不存在 → 置灰 + toast
      disabled: true,
      format: value => Number.parseFloat(value ?? 0).toFixed(2),
    },
    {
      key: 'gift_amount',
      route: '',
      unit: '个',
      label: '我的优惠',
      theme: 'danger',
      disabled: true,
    },
    {
      key: 'point',
      route: '',
      unit: '分',
      label: '我的积分',
      theme: 'success',
      disabled: true,
    },
  ],
  nav: [
    [
      {
        route: ROUTES.ORDER,
        title: '我的订单',
        icon: 'order',
        theme: 'primary',
      },
      {
        route: ROUTES.ADDRESS_HOME,
        title: '收货地址',
        icon: 'location',
        theme: 'primary',
      },
      {
        route: '',
        title: '饿了么会员卡',
        icon: 'vip',
        theme: 'vip',
        disabled: true,
      },
    ],
    [
      {
        route: '',
        title: '服务中心',
        icon: 'service',
        theme: 'primary',
        disabled: true,
      },
      // ⚠️ /download 项已删除（小程序语义不成立 + 审核风险，方案 D2 建议处置）
    ],
  ],
}
