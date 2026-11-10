/**
 * 地址表单校验 schema（uni-user 已按市面布局重构，与 web-user 有意分叉，不再要求逐行同步）。
 * 不抽共享包的原因见迁移方案议题 7。
 *
 * ★ 与 web-user 的差异：
 * 1. `pattern: /^[\p{Unified_Ideograph}a-zA-Z\s]+$/u` 依赖小程序 JS 引擎（V8）的
 *    Unicode property escape 支持 —— Batch 0 已在微信基础库里实测可用，保持原样
 * 2. 字段键与 AddressAdd.vue 的目标布局对齐：`region`（省市区，required，只校验非空，
 *    结果不入库）、`detail`（详细地址主体，映射后端 address）、`door`（门牌号，选填，
 *    映射后端 addressDetail，120 上限对齐后端 MaxLength）、`tag`（标签，选填，
 *    20 上限对齐后端 MaxLength）；性别已从 UI 移除，不再设校验键（form.sex 保留默认 1）
 */
export const addressSchema = {
  name: [
    {
      required: true,
      message: '姓名不能为空',
    },
    { validator: v => v.length >= 2 || '姓名至少2个字符' },
    { validator: v => v.length <= 20 || '姓名不能超过20个字符' },
    {
      pattern: /^[\p{Unified_Ideograph}a-zA-Z\s]+$/u,
      message: '姓名只能包含中文、英文和空格',
    },
  ],
  region: [
    {
      required: true,
      message: '请选择所在地区',
    },
  ],
  detail: [
    {
      required: true,
      message: '详细地址不能为空',
    },
    { validator: v => v.length >= 2 || '详细地址至少2个字符' },
    { validator: v => v.length <= 120 || '详细地址不能超过120个字符' },
  ],
  door: [
    // 选填：空值直接通过，非空时只做长度上限（对齐后端 addressDetail 的 MaxLength(120)）
    {
      validator: (v) => {
        if (!v?.trim())
          return true
        return v.length <= 120 || '门牌号不能超过120个字符'
      },
    },
  ],
  tag: [
    // 选填：默认「常用」，仅做长度上限（对齐后端 tag 的 MaxLength(20)）
    {
      validator: (v) => {
        if (!v?.trim())
          return true
        return v.length <= 20 || '标签不能超过20个字符'
      },
    },
  ],
  phone: [
    {
      required: true,
      message: '手机号不能为空',
    },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '手机号格式不正确',
    },
  ],
  phoneBk: [
    {
      validator: (v) => {
        if (!v?.trim())
          return true
        return /^1[3-9]\d{9}$/.test(v) || '备用电话格式不正确'
      },
    },
  ],
}
