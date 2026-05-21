import mitt from 'mitt'

/** 全局事件类型定义 */
interface Events extends Record<string | symbol, unknown> {
  /** 标签页被点击 */
  tagOnClick: string
  /** 侧边栏菜单导航 → 标签页同步 */
  changeLayoutRoute: string
}

const emitter = mitt<Events>()

export default emitter
