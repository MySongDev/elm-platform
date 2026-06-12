import NProgress from 'nprogress'

import 'nprogress/nprogress.css'
import '/src/assets/styles/nprogress.css'

// 配置NProgress（可选）
NProgress.configure({
  easing: 'ease', // 动画方式
  speed: 500, // 进度条速度
  showSpinner: false, // 是否显示右上角旋转加载器（建议关闭，更清爽）
  trickleSpeed: 200, // 自动递增间隔
  minimum: 0.3, // 初始化时的最小百分比
  parent: 'body', // 指定父容器
})
export default NProgress
