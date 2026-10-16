<script setup>
/**
 * ⚠️ 与 apps/web-user/src/components/common/ShopList/ShopList.vue 同源改造。
 *
 * 差异（四处，均为平台机制所致）：
 * 1. **BackTop 不再内嵌**：web-user 用 `<Teleport to="body">` 挂它，小程序端无 Teleport。
 *    改由页面按需挂载 `<BackTop :scroll-top="..." @to-top="...">`（组件已改为纯展示+事件）。
 * 2. **无限滚动改 scroll-view 原生事件**：useInfiniteScroll 不再返回 sentinel ref，
 *    而是返回 onReachBottom 处理函数，由模板的 `@scrolltolower` 接。
 *    ⚠️ 前提：本组件必须放在 scroll-view 内（或自身就是滚动容器的子树）。
 * 3. van-empty → DefaultEmpty（uni-ui 无 empty 组件，方案「UI 库选型」已定用自研）
 * 4. van-loading → LocalLoading（自研 CSS spinner）
 *
 * ⚠️ 保留 pageRef/enableBackTop 两个 prop 的**签名**但忽略其值：
 * 调用方（msite/search）迁移时若仍传，不会报错；BackTop 相关行为已外移。
 * （不删 prop 是为了让 Batch 3 迁页面时能逐个清理而非一次性炸出未定义属性警告。）
 */
import { computed, toRef } from 'vue'

import DefaultEmpty from '@/components/common/BaseState/common/DefaultEmpty.vue'
import LocalLoading from '@/components/common/Loading/LocalLoading.vue'
import ShopListSkeleton from '@/components/common/Skeleton/ShopListSkeleton.vue'
import { useInfiniteScroll } from '@/composables/ui/useInfiniteScroll'
import ShopItem from './ShopItem.vue'

const props = defineProps({
  list: {
    type: Array,
    default: () => [],
  },
  loading: Boolean,
  finished: Boolean,
  threshold: {
    type: Number,
    default: 250,
  },
  // ⚠️ 签名保留、值忽略（见文件头第 4 条）
  pageRef: Object,
  enableBackTop: {
    type: Boolean,
    default: true,
  },
  skeleton: {
    type: Boolean,
    default: true,
  },
  skeletonRows: {
    type: Number,
    default: 6,
  },
})

const emit = defineEmits(['item-click', 'reach-bottom'])

void props.pageRef
void props.enableBackTop
// threshold 的语义已外移：它是 scroll-view 的 lower-threshold（距底多少 px 触发），
// 组件内部不再消费。保留 prop 是为了让调用方的传参不报错，Batch 3 迁页面时改透传到 scroll-view。
void props.threshold

const { onReachBottom } = useInfiniteScroll({
  loading: toRef(props, 'loading'),
  finished: toRef(props, 'finished'),
  callback: () => emit('reach-bottom'),
})

const showSentinel = computed(() => props.list.length > 0 || props.loading)
const showInitialSkeleton = computed(() => props.skeleton && props.loading && props.list.length === 0)

// ⚠️ 触底事件必须由**外层 scroll-view** 的 @scrolltolower 接入：
// <scroll-view scroll-y :lower-threshold="threshold" @scrolltolower="shopListRef?.onReachBottom()">
// 不能在组件内部自己监听（组件拿不到 scroll-view 实例），也不能用点击兜底
// （点「到底了」触发加载是错误语义）。
defineExpose({ onReachBottom })
</script>

<template>
  <view class="shopping-container">
    <ShopListSkeleton
      v-if="showInitialSkeleton"
      :rows="skeletonRows"
    />

    <view
      v-else-if="list.length > 0"
      class="shopping-list"
    >
      <ShopItem
        v-for="item in list"
        :key="item.id"
        :item="item"
        @click="emit('item-click', $event)"
      />
    </view>

    <view
      v-else-if="!loading"
      class="empty-placeholder"
    >
      <DefaultEmpty />
    </view>

    <!-- 底部状态条：只展示，不接点击（触底加载由外层 scroll-view 的
         @scrolltolower → defineExpose 的 onReachBottom 接入，见 script 注释） -->
    <view
      v-show="!showInitialSkeleton && showSentinel"
      class="list-footer"
    >
      <view
        v-if="loading"
        class="loading-status"
      >
        <LocalLoading text="加载中..." />
      </view>
      <text
        v-else-if="finished"
        class="finished-status"
      >
        —— 到底了 ——
      </text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.shopping-container {
  width: 100%;
}

.list-footer {
  padding: 30rpx 0;
  font-size: 24rpx;
  color: #999;
  text-align: center;
}

.empty-placeholder {
  padding: 80rpx 0;
}
</style>
