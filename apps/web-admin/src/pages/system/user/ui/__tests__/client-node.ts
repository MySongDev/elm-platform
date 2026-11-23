/**
 * @file 用户编辑器测试环境
 * @domain pages/system/user
 * @description 沿用 node 运行时，使用客户端编译供 Vue 内存渲染器挂载编辑器。
 */

import { builtinEnvironments } from 'vitest/runtime'

export default {
  ...builtinEnvironments.node,
  name: 'client-node',
  viteEnvironment: 'client',
}
