# npm �?pnpm 的关系和区别

## 1. 核心结论

`npm` �?`pnpm` 都是 JavaScript / Node.js 生态里的包管理器�?
它们都可以完成这些事情：

```text
安装依赖
卸载依赖
运行 scripts
管理 package.json
生成 lockfile
发布�?管理 workspace
```

一句话理解�?
> npm �?Node.js 默认包管理器；pnpm 是兼�?npm 生态、但更快、更省空间、更严格、更适合 monorepo 的包管理器�?
它们不是两个完全不同的生态，而是�?
```text
npm registry：包仓库
npm CLI：官方默认包管理器客户端
pnpm CLI：另一个包管理器客户端，也能使�?npm registry
```

---

## 2. npm 是什�?
`npm` 全称是：

```text
Node Package Manager
```

通常安装 Node.js 后会自带 npm�?
常见命令�?
```bash
node -v
npm -v
npm install
npm install axios
npm run dev
npm run build
```

npm 主要负责�?
```text
�?npm registry 下载依赖
把依赖安装到 node_modules
维护 package.json
维护 package-lock.json
运行 scripts
发布包到 npm registry
```

npm �?Node.js 生态默认的包管理工具�?
---

## 3. pnpm 是什�?
`pnpm` 可以理解为：

```text
performant npm
```

它也�?Node.js 生态里的包管理器�?
常见命令�?
```bash
pnpm install
pnpm add axios
pnpm dev
pnpm build
```

pnpm 默认也从 npm registry 下载包�?
所以：

```text
pnpm 使用 npm 生态的包�?pnpm 可以读取 package.json�?pnpm 可以安装 npm registry 上的依赖�?```

pnpm 不是另一个生态，而是 npm 生态里的另一种包管理器实现�?
---

## 4. npm �?pnpm 的关�?
可以这样理解�?
```text
registry 是仓库；
npm / pnpm 是客户端工具�?```

类比�?
```text
npm registry 像应用商店服务器�?npm �?pnpm 像不同的下载/安装客户端�?```

例如�?
```bash
npm install vue
```

和：

```bash
pnpm add vue
```

本质上都是从 npm registry 获取 `vue` 这个包�?
---

## 5. 最大区别：依赖存储方式不同

### 5.1 npm 的依赖安装方�?
npm 会把依赖安装到项目的 `node_modules` 中�?
简化理解：

```text
project/
  node_modules/
    vue/
    axios/
    lodash/
```

现代 npm 也会做扁平化和去重，但整体上，依赖会被放进项目自己的 `node_modules`�?
不同项目安装同一个包时，可能会各自有一份�?
### 5.2 pnpm 的依赖安装方�?
pnpm 使用全局内容寻址存储�?
简化理解：

```text
全局 pnpm store/
  vue@3.5.x
  axios@1.x
  lodash@4.x

project/
  node_modules/
    vue -> 链接�?pnpm store
    axios -> 链接�?pnpm store
```

pnpm 的特点是�?
```text
真实包内容放在全局 store�?项目 node_modules 通过硬链�?/ 符号链接引用依赖�?```

好处�?
```text
多个项目共享同一份包内容�?节省磁盘空间�?安装速度通常更快�?```

所�?pnpm 的一个核心优势是�?
> 快、省空间�?
---

## 6. 第二个区别：pnpm 更严�?
npm �?`node_modules` 扁平化后，有时会出现“幽灵依赖”�?
### 6.1 什么是幽灵依赖

假设项目 `package.json` 中没有声�?`lodash`�?
```json
{
  "dependencies": {
    "some-lib": "1.0.0"
  }
}
```

�?`some-lib` 内部依赖�?`lodash`�?
在某�?npm 安装结构下，你可能仍然可以在项目代码里直接写�?
```ts
import lodash from 'lodash'
```

即使项目没有显式声明 `lodash`�?
这就是幽灵依赖：

> 使用了一个没有在当前项目中显式声明的依赖，只是因为它刚好被别的包带进来了�?
风险是：

```text
以后 some-lib 不再依赖 lodash，项目代码就可能突然坏掉�?```

### 6.2 pnpm 如何减少幽灵依赖

pnpm 默认的依赖结构更严格�?
原则是：

> 项目只能直接访问自己声明过的依赖�?
如果你没有在 `package.json` 里声明：

```json
{
  "dependencies": {
    "lodash": "..."
  }
}
```

那你就不应该直接 `import lodash from 'lodash'`�?
这使得项目依赖关系更干净�?
所�?pnpm 的另一个重要优势是�?
> 防止幽灵依赖，让依赖声明更真实�?
---

## 7. lockfile 不同

npm 使用�?
```text
package-lock.json
```

pnpm 使用�?
```text
pnpm-lock.yaml
```

它们都用于锁定依赖版本，保证不同机器安装结果一致�?
但它们格式不同，不能混用�?
所以一个项目最好只使用一种包管理器�?
如果项目使用 pnpm，通常应该避免提交�?
```text
package-lock.json
yarn.lock
```

只保留：

```text
pnpm-lock.yaml
```

---

## 8. 命令差异

| 操作 | npm | pnpm |
|---|---|---|
| 安装全部依赖 | `npm install` | `pnpm install` |
| 添加生产依赖 | `npm install axios` | `pnpm add axios` |
| 添加开发依�?| `npm install eslint -D` | `pnpm add eslint -D` |
| 删除依赖 | `npm uninstall axios` | `pnpm remove axios` |
| 运行脚本 | `npm run dev` | `pnpm dev` �?`pnpm run dev` |
| 执行一次性包命令 | `npx vite` | `pnpm dlx vite` |
| 过滤 workspace | 支持但体验不�?| `pnpm --filter app run dev` |

pnpm �?monorepo 场景下通常体验更好�?
---

## 9. workspace 能力

npm 也支�?workspace，但 pnpm workspace 在前�?monorepo 中非常常见�?
pnpm workspace 通常有：

```text
pnpm-workspace.yaml
```

例如�?
```yaml
packages:
  - apps/*
  - packages/*
```

对于类似下面的项目结构：

```text
apps/server
apps/web-admin
apps/web-user
packages/*
```

pnpm 可以方便地运行某个子项目�?
```bash
pnpm --filter @elm-platform/web-admin run dev
pnpm --filter @elm-platform/server run build
pnpm --filter @elm-platform/web-user run test
```

这对 monorepo 很有价值�?
---

## 10. 配置文件关系

npm 常见配置�?
```text
.npmrc
package-lock.json
```

pnpm 常见配置�?
```text
.npmrc
pnpm-lock.yaml
pnpm-workspace.yaml
package.json �?packageManager
```

需要注意：

> pnpm 也会读取 `.npmrc` 中的很多配置�?
例如�?
```ini
registry=https://registry.npmmirror.com
```

虽然文件名叫 `.npmrc`，但 pnpm 也会使用它�?
---

## 11. �?Corepack 的关�?
现在更推荐用 Corepack 管理包管理器版本�?
例如 `package.json`�?
```json
{
  "packageManager": "pnpm@10.0.0"
}
```

然后执行�?
```bash
corepack enable
pnpm install
```

Corepack 会保证项目使用指定版本的 pnpm�?
关系是：

```text
Node.js 提供 Corepack�?Corepack �?npm / pnpm / yarn 的版本�?pnpm 负责安装依赖�?```

---

## 12. 什么时候用 npm

适合�?
```text
简单项目�?Node 默认环境�?不想额外引入工具�?团队已经统一使用 npm�?�?monorepo 没有高要求�?```

优点�?
```text
Node 自带�?学习成本低�?兼容性强�?官方默认�?```

缺点�?
```text
安装速度和磁盘复用不�?pnpm�?monorepo 体验一般�?依赖结构相对�?pnpm 严格�?```

---

## 13. 什么时候用 pnpm

适合�?
```text
中大型前端项目�?monorepo 项目�?多应�?workspace�?希望依赖安装更快�?希望节省磁盘空间�?希望依赖声明更严格�?团队愿意统一工具链�?```

优点�?
```text
速度快�?省磁盘�?workspace 强�?依赖结构严格�?适合 monorepo�?```

缺点�?
```text
需要团队统一使用�?某些老项�?/ 老工具可能对 pnpm 结构不兼容�?新人需要理�?pnpm workspace �?--filter�?```

---

## 14. �?Elm 项目的意�?
当前 Elm 项目�?pnpm workspace�?
```text
apps/server
apps/web-admin
apps/web-user
packages/*
```

所以使�?pnpm 是合理的�?
它可以：

```text
统一管理三个 app 的依赖�?�?--filter 精准运行某个子项目�?共享 lockfile�?支持 packages/* 共享包�?减少重复依赖安装�?```

常见命令�?
```bash
pnpm --filter @elm-platform/web-admin run dev
pnpm --filter @elm-platform/server run test
pnpm --filter @elm-platform/web-user run build
```

这比每个 app 单独 `npm install` 更适合当前项目结构�?
---

## 15. 总结对比

| 维度 | npm | pnpm |
|---|---|---|
| 定位 | Node 默认包管理器 | 高性能包管理器 |
| 是否使用 npm registry | �?| �?|
| lockfile | `package-lock.json` | `pnpm-lock.yaml` |
| 依赖存储 | 项目 node_modules 为主 | 全局 store + 链接 |
| 磁盘占用 | 相对更高 | 更省空间 |
| 安装速度 | 较快 | 通常更快 |
| 依赖严格�?| 相对宽松 | 更严格，减少幽灵依赖 |
| workspace | 支持 | 更常用于 monorepo |
| 配置文件 | `.npmrc` | `.npmrc`、`pnpm-workspace.yaml` |
| 默认可用�?| Node 自带 | 通常通过 Corepack 或单独安�?|
| 适合场景 | 简单项目、默认生�?| monorepo、中大型项目、工程化项目 |

一句话记忆�?
> npm 默认、通用、简单；pnpm 高效、严格、适合工程化和 monorepo�?
