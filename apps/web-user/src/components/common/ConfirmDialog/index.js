import { createVNode, render } from 'vue'

import ConfirmDialog from './ConfirmDialog.vue'

export function confirm(options) {
  // 支持字符串简写
  if (typeof options === 'string') {
    options = { title: options }
  }

  return new Promise((resolve) => {
    // 1创建容器
    const container = document.createElement('div')
    document.body.appendChild(container)

    // 销毁函数
    const destroy = () => {
      render(null, container)
      container.remove()
    }

    //  创建 vnode
    const vnode = createVNode(ConfirmDialog, {
      ...options,
      'modelValue': true, // modelValue是默认名字
      // v-model 更新
      'onUpdate:modelValue': (val) => {
        if (!val)
          destroy()
      },

      // 点击确定
      'onConfirm': () => {
        resolve(true)
        destroy()
      },

      // 点击取消
      'onCancel': () => {
        resolve(false)
        destroy()
      },
    })

    // 渲染
    render(vnode, container)
  })
}
