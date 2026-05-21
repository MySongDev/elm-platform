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
      route: '/balance',
      unit: '元',
      label: '我的余额',
      theme: 'warning',
      format: value => Number.parseFloat(value ?? 0).toFixed(2),
    },
    { key: 'gift_amount', route: '/benefit', unit: '个', label: '我的优惠', theme: 'danger' },
    { key: 'point', route: '/points', unit: '分', label: '我的积分', theme: 'success' },
  ],
  nav: [
    [
      { route: '/order', title: '我的订单', icon: 'order', theme: 'primary' },
      { route: '/profile/address', title: '收货地址', icon: 'location', theme: 'primary' },
      { route: '/vipcard', title: '饿了么会员卡', icon: 'vip', theme: 'vip' },
    ],
    [
      { route: '/service', title: '服务中心', icon: 'service', theme: 'primary' },
      { route: '/download', title: '下载饿了么 APP', icon: 'download', theme: 'primary' },
    ],
  ],
}
