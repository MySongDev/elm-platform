# 017 — 收货地址示例数据留档

| 功能 | 实现位置 | 说明 |
|---|---|---|
| 只读示例地址 | `apps/uni-user/src/composables/features/address/extras/demo-addresses.js` | 仅保留演示数据，不进入用户真实列表 |
| 真实地址空态 | `apps/uni-user/src/pkg-profile/addressHome.vue` | 真实列表为空时显示「暂无收货地址」 |

## 为什么移出主链路

旧的 `useAddressDisplay` 在真实列表为空时换成三条demo地址，页面又给它们编辑和删除按钮。用户看到的是不存在的地址；demo ID也不能用于后端整数ID接口。

现在默认只展示账号真实数据，示例从活跃barrel移出，文件留在extras，不删除。

## 如何重新启用演示

需要演示页时，显式导入 `extras/demo-addresses.js`，在独立只读页面渲染。页面必须明确标记「示例」，不显示真实编辑、删除、设默认按钮；不把demo ID传给地址API，不写入地址store。

不能重新把空真实列表替换成示例。空列表是有意义的业务状态，不是取数失败或演示开关。
