<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/forget/components/FormItem.vue 同源改造。
 *
 * HTML input → 小程序 input 的属性映射：
 * | web-user | uni-user | 说明 |
 * |---|---|---|
 * | `type="tel"` | `type="number"` | 小程序 input 无 tel；number 弹数字键盘 |
 * | `type="password"` | `password` 布尔属性 | 小程序用独立属性而非 type 值 |
 * | `inputmode` / `pattern` / `autocomplete` | **删除** | 小程序 input 无这三个属性 |
 * | `:for` / `:id`（label 关联） | **删除** | 小程序无 label-for 机制，label 纯展示 |
 * | `@input` 的 `event.target.value` | `event.detail.value` | 小程序事件结构不同 |
 *
 * ⚠️ ⑧ 类手工换算：`@include wh(100%, 45px)` → `wh(100%, 90rpx)`；
 * `@include wh(100%, 1px)`（分隔线）→ 保留 1px + scaleY(0.5) 的发丝线技巧不转
 * （这是 ① 类「height 1px 不转」的同源意图，但此处是伪元素分隔线，
 * 方案议题 4 ⑧ 的表格建议转 2rpx —— 实测 scaleY(0.5) 技巧在小程序端同样有效，
 * 保留 1px 更细更贴近 H5 观感。**与方案表格的建议不同，已在注释标明**）。
 */
const props = defineProps({
  label: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    required: true,
  },
  maxlength: {
    type: [Number, String],
    default: undefined,
  },
  /** 受控聚焦：小程序端无法 querySelector().focus()，由父页面置 true 触发 */
  focus: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['input'])

const model = defineModel({
  type: String,
  default: '',
})

void props.name

/** 小程序 input 的 type 白名单：text/number/idcard/digit，其余归一 */
function mapType(type) {
  if (type === 'password')
    return 'text'
  if (type === 'tel')
    return 'number'
  return ['text', 'number', 'idcard', 'digit'].includes(type) ? type : 'text'
}

function handleInput(event) {
  emit('input', event)
}
</script>

<template>
  <view class="form-item">
    <text class="form-label">
      {{ label }}
    </text>
    <input
      v-model="model"
      class="form-input"
      :type="mapType(type)"
      :password="type === 'password'"
      :placeholder="placeholder"
      :maxlength="maxlength === undefined ? -1 : Number(maxlength)"
      :focus="focus"
      @input="handleInput"
    >
    <slot />
  </view>
</template>

<style lang="scss" scoped>
.form-item {
  @include flex-center($justify: flex-start);
  @include wh(100%, 90rpx);

  position: relative;
  padding: 24rpx;

  &::after {
    /* 发丝分隔线：保留 1px + scaleY(0.5)，与方案 ⑧ 表格「建议转 2rpx」不同 ——
       scaleY 技巧在小程序端有效且更贴近 H5 观感（见文件头说明） */
    @include wh(100%, 1px);

    position: absolute;
    bottom: 0;
    left: 0;
    content: '';
    background: #e3e5e7;
    transform: scaleY(0.5);
    transform-origin: 0 0;
  }

  .form-label {
    min-width: 120rpx;
    margin-right: 24rpx;
    font-size: 28rpx;
    color: #18191c;
    text-align: right;
  }

  .form-input {
    flex: 1;
    min-width: 0;
    font-size: 28rpx;
  }
}
</style>
