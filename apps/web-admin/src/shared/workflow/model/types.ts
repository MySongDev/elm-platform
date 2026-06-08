/**
 * 通用状态机 UI 类型定义
 *
 * 用于 StatusTag、StateMachineActions、StateMachineTimeline 等共享组件。
 * 不包含业务规则，只定义 UI 表达所需的数据结构。
 */

/** Element Plus tag/button type */
export type WorkflowTagType = '' | 'success' | 'warning' | 'danger' | 'info' | 'primary'

/**
 * 状态标签配置
 * 每个状态映射到一个标签文案和颜色类型
 */
export interface StatusTagConfig {
  label: string
  type: WorkflowTagType
}

/**
 * 动作配置
 * 定义一个动作按钮的展示和权限要求
 */
export interface ActionConfig {
  /** 按钮文案（支持 i18n key 或纯文本） */
  label: string
  /** 按钮颜色类型 */
  type?: WorkflowTagType
  /** 所需前端权限码（不传则不做权限过滤） */
  permission?: string
  /** 确认弹窗文案（不传则不弹确认框） */
  confirmText?: string
  /** 是否为危险操作（影响按钮颜色） */
  danger?: boolean
  /** 自定义可见性判断 */
  visible?: (record: any) => boolean
}

/**
 * 状态机动作可见性判断参数
 */
export interface ActionVisibilityContext {
  /** 后端返回的当前可用动作列表 */
  availableActions: string[]
  /** 权限检查函数 */
  hasPermission: (permission: string) => boolean
  /** 当前记录（用于 visible 判断） */
  record: any
}

/**
 * 时间线条目
 */
export interface TimelineEntry {
  /** 唯一标识 */
  id?: string
  /** 事件/动作名称 */
  event: string
  /** 事件标签（展示用） */
  eventLabel?: string
  /** 源状态 */
  fromStatus?: string
  /** 目标状态 */
  toStatus?: string
  /** 操作人名称 */
  actorName?: string
  /** 原因/备注 */
  reason?: string
  /** 备注 */
  remark?: string
  /** 时间戳 */
  createdAt: string | Date
  /** 节点颜色类型 */
  type?: WorkflowTagType
}

/**
 * 完整的 workflow 配置
 * 业务模块通过此配置驱动共享组件
 */
export interface WorkflowConfig<
  S extends string = string,
  A extends string = string,
> {
  /** 状态标签映射 */
  statusMap: Record<S, StatusTagConfig>
  /** 动作配置映射 */
  actionMap: Record<A, ActionConfig>
}
