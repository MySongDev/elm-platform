# 018 — uni-user 地址输入表单与旧组件留档

| 功能 | 实现位置 | 说明 |
|---|---|---|
| 地址输入表单项 | `apps/uni-user/src/pkg-profile/components/FormInput.vue` | 标题、输入框、选填标识和错误提示在一个组件内，页面仍负责校验与保存 |
| 插槽式表单布局（留档） | `apps/uni-user/src/pkg-profile/components/extras/FormItemWrapper.vue` | 当前主链路零引用；多个不同控件需要同一布局时可复用 |
| 性别选择器（留档） | `apps/uni-user/src/pkg-profile/components/extras/SexSelector.vue` | 只依赖同目录的留档布局；当前地址页不显示性别 |

## 1. 为什么保留 FormInput，而内联布局

地址页有五个输入字段，重复的是整项布局与输入回传，不只是一行 input。保留页面私有的 FormInput，可以统一展示和原生输入事件取值；不需要为了跨页面复用把它提升成全局组件。

旧 FormItemWrapper 在当前页面只服务 FormInput，另一个引用来自未接入的 SexSelector。拆两层增加一次跳转和插槽边界，却没有活跃的不同控件复用布局。现已把布局内联到 FormInput，把两个旧组件一起移入 extras；保留相对导入，未删除它们的能力。

只修改 uni-user，未同步改动 web-user 的独立实现。

## 2. 当前组件接口

- `v-model`：字符串。原生 input 从 `event.detail.value` 取值。
- `type`：默认 `text`；电话字段由页面传 `number`。
- `label`、`placeholder`、`error`：默认空字符串。
- `maxlength`：默认 `-1`，表示不限制。页面明确传姓名 `20`、详细地址和门牌号 `120`、电话 `11`，与现有 addressFormSchema 的上限一致。
- `optional`：展示选填标识；输入区右侧预留空间，标识不接收点击。
- `input`、`blur`：都携带字符串，不是原生事件对象。input 先发送 `update:modelValue`，再发送 `input`，使页面校验读取到新值。

已移除当前没有用途的 `name`/`data-field` 和名为 readonly、实际禁用输入的参数；旧事件 `field-change`/`field-blur` 改为 `input`/`blur`，全部页面调用已同步。

**不做通用属性透传。** 当前小程序编译器 5.26 对 `v-bind="$attrs"` 报 `v-bind="" is not supported.`。因此保持 `inheritAttrs: false`；需要 focus、confirm-type 等新能力时，在 props 中声明有明确默认值的参数，并在内部 input 逐项绑定，同时验证小程序构建。不要只在页面随手传属性，也不要搬回 H5 的对象式 v-bind。

## 3. 输入长度问题的证据边界

旧组件只有 `maxlength: Number`，姓名、详细地址和门牌号不传这个参数，却仍编译为动态绑定的原生 maxlength。现在组件和调用处都给出明确值，消除了空值输入属性这一风险。

[uni-app 官方 input 文档](https://uniapp.dcloud.net.cn/component/input.html)规定默认长度 `140`，`-1` 表示不限制。不能把「源码未传参数」当成「编译后原生节点没有该属性」。

**已完成静态检查与微信构建，尚未完成开发者工具/真机输入验收。** 不把模拟 JS 的结果当成微信原生行为，也不把“空值按 0 处理”的怀疑写成已经实测的结论。

## 4. 何时重新接入 FormItemWrapper

只有多个活跃的不同控件确实需要同一套标题、错误提示布局时再抽取，不为了组件层数或未来可能复用恢复。

1. 在需要它的页面或组件显式导入 `./components/extras/FormItemWrapper.vue`（按调用处调整相对路径）。
2. 使用 `label`、`error` 和默认插槽包装新控件。不要再在外面重复一套标题、错误提示。
3. 输入控件的样式仍放在拥有 input 的组件内，不依赖未验证的跨组件样式穿透。
4. 若 FormInput 重新用它，也应移出当前内联布局，而不是嵌套两套 form-item。
5. 运行 type-check、ESLint、stylelint、微信构建，并人工确认插槽内控件可输入。

## 5. 何时重新接入 SexSelector

业务明确要让用户修改性别时再启用。当前页面仍保留 `form.sex`，编辑从服务器回填；不显示选择器并不意味着可以删除这个字段或用默认值覆盖旧记录。

```vue
<script setup>
import SexSelector from './components/extras/SexSelector.vue'
</script>

<template>
  <SexSelector v-model="form.sex" />
</template>
```

这是插入既有 AddressAdd.vue 的导入和模板，不是另建第二个 script setup。留档选择器约定 `1`、`2` 两种值，并保留原事件 `field-change`；当前 FormInput 的 input/blur 改名没有扩展到这个未接入组件。需要性别校验时由页面 schema 明确增加，不在组件内部塞地址业务规则。

## 6. 验收

在微信开发者工具使用 `dist/dev/mp-weixin`（连接本地后端），或针对生产配置使用 `dist/build/mp-weixin`：

1. 新增页输入姓名、中文地址、门牌号和 11 位电话，失焦后内容不消失。
2. 名字输入单字触发现有错误，补足字符后能正常通过校验。
3. 门牌号和备用电话的选填标识不遮住输入文字，点击输入区可聚焦。
4. 编辑页能回填并修改已有内容，地区仍保持编辑时选填。
5. 保存与再次打开地址，确认内容正确；保存测试会修改账号数据，应使用测试账号。
