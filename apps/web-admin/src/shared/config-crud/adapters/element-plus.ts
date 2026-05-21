/**
 * @file Element Plus CRUD 反馈适配器
 * @domain shared/config-crud
 * @description 将配置化 CRUD 的反馈接口绑定到 Element Plus 消息框和消息提示，隔离 UI 库依赖。
 */

import type { ConfigCrudFeedback } from '../model/feedback'
import { ElMessage, ElMessageBox } from 'element-plus'

interface ElementPlusCrudFeedbackOptions {
  deleteConfirmTitle?: string
}

/**
 * @description 有副作用：返回的反馈实现会打开 Element Plus 确认框，并触发保存/删除成功消息。
 * @param options Element Plus 删除确认框配置。
 * @returns 配置化 CRUD 可消费的反馈适配器。
 */
export function createElementPlusCrudFeedback(options: ElementPlusCrudFeedbackOptions = {}): ConfigCrudFeedback {
  return {
    async confirmDelete(message) {
      try {
        await ElMessageBox.confirm(message, options.deleteConfirmTitle ?? '提示', { type: 'warning' })
        return true
      }
      catch {
        return false
      }
    },
    notifySaveSuccess: message => ElMessage.success(message),
    notifyDeleteSuccess: message => ElMessage.success(message),
  }
}
