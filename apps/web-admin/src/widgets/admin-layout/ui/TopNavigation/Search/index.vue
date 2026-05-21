<script setup lang="ts">
import { IconSearch as IconEpSearch } from '@iconify-prerendered/vue-ep'
import { useTemplateRef } from 'vue'
import SearchResultItem from './SearchResultItem.vue'
import { useSearchDialog } from './useSearchDialog'

defineOptions({ name: 'GlobalSearchDialog' })

const { t } = useI18n()
const inputRef = useTemplateRef<HTMLInputElement>('searchInput')

const {
  activeIndex,
  displayList,
  emptyText,
  keyword,
  visible,
  close,
  handleSelect,
  onKeydown,
  open,
} = useSearchDialog(inputRef)

defineExpose({ open })
</script>

<template>
  <Teleport to="body">
    <transition name="el-fade-in">
      <div v-if="visible" class="global-search-overlay" @click.self="close">
        <div
          class="global-search-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="global-search-title"
          @keydown="onKeydown"
        >
          <div id="global-search-title" class="global-search-dialog__title">
            {{ t('globalSearch.title') }}
          </div>
          <div class="global-search-input">
            <el-icon class="global-search-input__icon">
              <IconEpSearch />
            </el-icon>
            <input
              ref="searchInput"
              v-model="keyword"
              class="global-search-input__control"
              :placeholder="t('globalSearch.placeholder')"
              autocomplete="off"
              spellcheck="false"
              role="combobox"
              aria-controls="global-search-results"
              :aria-expanded="visible"
            >
            <kbd class="global-search-input__hint">ESC</kbd>
          </div>

          <div id="global-search-results" class="global-search-results" role="listbox">
            <template v-if="displayList.length">
              <SearchResultItem
                v-for="(item, index) in displayList"
                :key="item.path || item.title"
                :item="item"
                :active="index === activeIndex"
                @select="handleSelect"
                @activate="activeIndex = index"
              />
            </template>
            <div v-else class="global-search-empty">
              {{ emptyText }}
            </div>
          </div>

          <div class="global-search-footer">
            <span><kbd>↑</kbd> <kbd>↓</kbd> {{ t('globalSearch.navigate') }}</span>
            <span><kbd>Enter</kbd> {{ t('globalSearch.select') }}</span>
            <span><kbd>Esc</kbd> {{ t('globalSearch.close') }}</span>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped lang="scss">
.global-search-overlay {
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: clamp(72px, 10vh, 112px);
  background: rgb(0 0 0 / 30%);
  backdrop-filter: blur(1px);
}

.global-search-dialog {
  display: flex;
  flex-direction: column;
  width: min(480px, calc(100vw - 32px));
  max-height: min(380px, calc(100vh - 120px));
  overflow: hidden;
  background: $bg-white;
  border: 1px solid rgb(0 0 0 / 6%);
  border-radius: 8px;
  box-shadow: 0 10px 28px rgb(0 0 0 / 14%);
  animation: globalSearchSlideDown 0.2s ease;
}

.global-search-dialog__title {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

@keyframes globalSearchSlideDown {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.global-search-input {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 44px;
  padding: 10px 14px;
  border-bottom: 1px solid $border-light;
}

.global-search-input__icon {
  flex-shrink: 0;
  font-size: 16px;
  color: $text-secondary;
}

.global-search-input__control {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: $text-primary;
  background: transparent;
  border: none;
  outline: none;

  &::placeholder {
    color: $text-placeholder;
  }
}

.global-search-input__hint,
.global-search-footer kbd {
  display: inline-block;
  font-family: inherit;
  color: $text-secondary;
  background: $bg-color;
  border: 1px solid $border-color;
}

.global-search-input__hint {
  flex-shrink: 0;
  padding: 1px 5px;
  font-size: 10px;
  border-radius: 4px;
}

.global-search-results {
  @include scroll-bar;

  flex: 1;
  padding: 4px;
  overflow-y: auto;
}

.global-search-empty {
  padding: 28px 0;
  font-size: 13px;
  color: $text-secondary;
  text-align: center;
}

.global-search-footer {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px 14px;
  font-size: 12px;
  color: $text-secondary;
  border-top: 1px solid $border-light;

  kbd {
    padding: 1px 5px;
    margin: 0 2px;
    font-size: 11px;
    border-radius: 3px;
  }
}

@media (width <= 520px) {
  .global-search-overlay {
    padding-top: 64px;
  }

  .global-search-dialog {
    width: calc(100vw - 24px);
    max-height: calc(100vh - 96px);
  }

  .global-search-footer {
    flex-wrap: wrap;
  }
}
</style>
