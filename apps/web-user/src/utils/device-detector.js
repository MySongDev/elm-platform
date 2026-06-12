/**
 * 获取完整的设备信息
 * @returns {object} 设备详细信息
 */
export function getDeviceInfo() {
  const ua = navigator.userAgent
  const platform = navigator.platform

  // 操作系统检测
  const os = (() => {
    if (/Windows/.test(ua))
      return 'windows'
    if (/Mac/.test(ua))
      return 'mac'
    if (/Linux/.test(ua))
      return 'linux'
    if (/Android/.test(ua))
      return 'android'
    if (/iOS|iPhone|iPad|iPod/.test(ua))
      return 'ios'
    return 'unknown'
  })()

  // 浏览器检测
  const browser = (() => {
    if (/Edg/.test(ua))
      return 'edge'
    if (/Chrome/.test(ua))
      return 'chrome'
    if (/Safari/.test(ua))
      return 'safari'
    if (/Firefox/.test(ua))
      return 'firefox'
    if (/MSIE|Trident/.test(ua))
      return 'ie'
    return 'unknown'
  })()

  // 设备类型
  const deviceType = (() => {
    if (/iPad/.test(ua))
      return 'tablet'
    if (/iPhone|iPod/.test(ua))
      return 'mobile'
    if (/Android/.test(ua)) {
      if (/Mobile/.test(ua))
        return 'mobile'
      return 'tablet'
    }
    return 'desktop'
  })()

  // 屏幕信息
  const screen = {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
    orientation: window.screen.orientation?.type || 'unknown',
  }

  // 触摸支持
  const touchSupport = {
    maxTouchPoints: navigator.maxTouchPoints,
    ontouchstart: 'ontouchstart' in window,
    touchEvent: 'TouchEvent' in window,
  }

  return {
    os,
    browser,
    deviceType,
    screen,
    touchSupport,
    userAgent: ua,
    platform,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isIOS: os === 'ios',
    isAndroid: os === 'android',
  }
}
