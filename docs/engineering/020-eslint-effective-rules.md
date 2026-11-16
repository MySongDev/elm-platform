# ESLint 生效规则快照（三个前端应用）

## 功能清单

| 功能 | 实现位置 | 说明 |
|---|---|---|
| 共用基线规则 | 仓库根 `eslint.config.mjs` 的 `sharedRules` | 语言级规则，server 与三个前端共同生效 |
| 模板排版规则 | 同文件末尾的共用 `.vue` 块 | web-admin、web-user、uni-user 三端同款，靠 `files` 数组覆盖 |
| 后端分层约束 | 同文件 `server-boundaries/*` 三个块 | 只匹配 `apps/server/src`，说明见 `016-backend-api-domain-boundaries.md` |
| 生效值快照 | 本文档表格 | 记录当前实际生效值，供 antfu 升级后 diff |

## 为什么要快照

antfu 的默认值会随大版本变化（例如 `vue/max-attributes-per-line` 在 antfu 7.x 是 `off`，与很多人印象中的“属性一行一个”相反）。本仓库只显式声明自己依赖的规则，其余交给 antfu 默认值；一旦升级，先 diff 本表就知道哪些默认值变了。

## 复核与重新生成

对每个应用取一个代表文件，导出有效配置：

```bash
npx eslint --print-config apps/web-admin/src/pages/system/user/index.vue > /tmp/admin.json
npx eslint --print-config apps/web-user/src/views/shop/shop.vue > /tmp/user.json
npx eslint --print-config apps/uni-user/src/pages/index/index.vue > /tmp/uni.json
```

按下表第一列的规则名，从 JSON 的 `rules` 字段取值。严重度：`0` 关闭、`1` 警告、`2` 错误。

## 生效值快照

| 规则 | web-admin | web-user | uni-user |
|---|---|---|
| `no-console` | `[0,{"allow":["warn","error"]}]` | `[0,{"allow":["warn","error"]}]` | `[0,{"allow":["warn","error"]}]` |
| `no-undef` | `[0,{"typeof":false}]` | `[0,{"typeof":false}]` | `[0,{"typeof":false}]` |
| `no-unused-vars` | `[0,{"args":"none","caughtErrors":"none","ignoreRestSiblings":true,"vars":"all"}]` | 同左 | 同左 |
| `e18e/prefer-static-regex` | `[0]` | `[0]` | `[0]` |
| `style/max-statements-per-line` | `[0,{"max":1}]` | `[0,{"max":1}]` | `[0,{"max":1}]` |
| `style/no-mixed-operators` | `[0,{"groups":[["==","!=","===","!==",">",">=","<","<="],["&&","||"],["in","instanceof"]],"allowSamePrecedence":true}]`（antfu 默认参数） | 同左 | 同左 |
| `antfu/consistent-list-newline` | `[2,{"ObjectExpression":false}]` | 同左 | 同左 |
| `style/object-curly-newline` | `[2,{"consistent":true,"multiline":true}]` | 同左 | 同左 |
| `style/object-property-newline` | `[2,{"allowAllPropertiesOnSameLine":false}]` | 同左 | 同左 |
| `unused-imports/no-unused-vars` | `[1,{"args":"after-used","argsIgnorePattern":"^_","varsIgnorePattern":"^_"}]` | 同左 | 同左 |
| `ts/no-empty-object-type` | `[0,{"allowInterfaces":"always"}]` | 同左 | 同左 |
| `max-depth` | `[1,3]` | `[1,3]` | `[1,3]` |
| `ts/no-explicit-any` | `[1]` | `[1]` | `[1]` |
| `ts/consistent-type-imports` | `[2,{"disallowTypeAnnotations":false,"fixStyle":"separate-type-imports","prefer":"type-imports"}]` | 同左 | 同左 |
| `vue/custom-event-name-casing` | `[0,"camelCase"]` | 同左 | 同左 |
| `vue/no-template-shadow` | `[0]` | `[0]` | `[0]` |
| `vue/html-indent` | `[2,2,{"attribute":1,"baseIndent":1,"closeBracket":0,"alignAttributesVertically":false,"ignores":[]}]` | 同左 | 同左 |
| `vue/max-attributes-per-line` | `[2,{"singleline":{"max":1},"multiline":{"max":1}}]` | 同左 | 同左 |
| `vue/html-closing-bracket-newline` | `[2,{"singleline":"never","multiline":"always"}]` | 同左 | 同左 |
| `vue/first-attribute-linebreak` | `[2,{"singleline":"ignore","multiline":"below"}]` | 同左 | 同左 |
| `vue/singleline-html-element-content-newline` | `[1]`（antfu 默认） | 同左 | 同左 |
| `vue/multiline-html-element-content-newline` | `[1]`（antfu 默认） | 同左 | 同左 |
| `vue/html-quotes` | `[2,"double"]` | 同左 | 同左 |
| `vue/html-self-closing` | `[1]` | 同左 | 同左 |

“同左”表示与 web-admin 列一致。

Node 环境块（`node/prefer-global/*`、`unicorn/prefer-object-has-own` 等）只匹配根脚本与 `apps/server`，在 `.vue` 文件上未配置，故不列入本表。

## 维护约定

- 新增或修改规则后，重新跑上面三条命令并更新本表；PR 里改 `eslint.config.mjs` 时必须同步本表。
- 升级 antfu 后先跑命令 diff，重点看本文档“antfu 默认值”那几行有没有变。
- 表格只收录本仓库显式配置的规则与模板排版相关的 antfu 默认值，不逐条列出全部 480+ 条。
