<script setup>
import { onLaunch, onShow } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('[uni-user] App onLaunch')
  console.log('[uni-user] App onLaunch')
})

onShow(() => {
  console.log('[uni-user] App onShow')
})
</script>

<style>
/* iconfont 字体图标：ttf 已 base64 内联（小程序 @font-face 不支持本地路径）。
   ⚠️ 必须在 App.vue 全局引入 —— 编译进 app.wxss 后所有页面/组件才能用 .icon-xxx 类。
   SvgIcon 组件的 style 块不 scoped 但只放基线样式，字体类在这里。 */
@import '@/static/iconfont/elm-iconfont.css';

/* 全局样式。uni-app 的 App.vue 不能有 template，只能作为生命周期容器 */
page {
  font-size: 28rpx;
  color: #333;
  background-color: #f5f5f5;
}

/* 全局隐藏滚动条（仍可滚动）。统一收口在 App.vue 全局样式（编译进 app.wxss），
   覆盖所有页面的 scroll-view / swiper / 任何 overflow 滚动容器。
   ⚠️ 依赖小程序内核对 ::-webkit-scrollbar 的支持；个别场景（如 scroll-view 开
   enhanced 增强模式）可能不生效，届时改用 scroll-view 的 :show-scrollbar="false"。 */
scroll-view::-webkit-scrollbar,
swiper::-webkit-scrollbar,
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
</style>
