<script setup>
import { computed, toRef, useTemplateRef } from 'vue'
import BackTop from '@/components/common/BackTop/BackTop.vue'
import ShopListSkeleton from '@/components/common/Skeleton/ShopListSkeleton.vue'
import { useInfiniteScroll } from '@/composables/ui'
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

const localContainer = useTemplateRef('localContainer')
const scrollTarget = computed(() => props.pageRef || localContainer.value)

const { sentinel } = useInfiniteScroll({
  target: scrollTarget,
  loading: toRef(props, 'loading'),
  finished: toRef(props, 'finished'),
  threshold: props.threshold,
  callback: () => emit('reach-bottom'),
})

const showSentinel = computed(() => props.list.length > 0 || props.loading)
const showInitialSkeleton = computed(() => props.skeleton && props.loading && props.list.length === 0)

function scrollToTop(behavior = 'smooth') {
  scrollTarget.value?.scrollTo({
    top: 0,
    behavior,
  })
}

defineExpose({ scrollToTop })
</script>

<template>
  <div ref="localContainer" class="shopping-container" :class="{ 'is-scrollable': !pageRef }">
    <ShopListSkeleton v-if="showInitialSkeleton" :rows="skeletonRows" />

    <ul v-else-if="list.length > 0" class="shopping-list">
      <ShopItem v-for="item in list" :key="item.id" :item="item" @click="emit('item-click', $event)" />
    </ul>

    <div v-else-if="!loading" class="empty-placeholder">
      <van-empty description="附近暂无商家" />
    </div>

    <div v-show="!showInitialSkeleton && showSentinel" ref="sentinel" class="list-footer">
      <div v-if="loading" class="loading-status">
        <van-loading size="18px">
          加载中...
        </van-loading>
      </div>
      <div v-else-if="finished" class="finished-status">
        —— 到底了 ——
      </div>
    </div>

    <Teleport to="body">
      <BackTop v-if="enableBackTop && scrollTarget" :target="scrollTarget" :threshold="400" :right="20" :bottom="80">
        <div class="back-top-icon">
          <van-icon name="arrow-up" />
        </div>
      </BackTop>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.shopping-container {
  &.is-scrollable {
    height: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

.list-footer {
  padding: 15px 0;
  font-size: 12px;
  color: #999;
  text-align: center;
}

.back-top-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
