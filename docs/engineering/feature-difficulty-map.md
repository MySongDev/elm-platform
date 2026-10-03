# 功能难点地图

这份文档记录项目里真正难的功能点，按用户端、管理端、后端三块分开，各自按难度从高到低排。

判断依据是代码体量和改动历史，不是性能实测：一个功能反复出现在 `docs/reports/` 的变更报告里，或者它的测试代码比实现还长，就说明它的复杂度是实打实踩出来的。普通的展示页、表单页和单表 CRUD 有固定写法，不在这份文档里。

## 用户端（apps/web-user）

用户端的难点集中在客户端状态：状态从哪来、以谁为准、什么时候失效。

### 1. 购物车与规格计价

涉及 `stores/modules/store-cart.js`、`utils/cart.ts`、`views/shop/components/ShopMenu/FoodSpecPanel.vue`。`FoodSpecPanel.vue` 是用户端最大的组件。

难在它不是简单的加减数量。一道菜有规格（大小、口味、加料），规格组合决定价格，同一道菜不同规格在购物车里是不同条目，还要按店铺分组、算总价、和本地持久化同步。规格面板那种多层选择加联动计价，是用户端交互里分支最多的地方。

### 2. 定位状态的一致性

纬度经度存在 location store 里，HTTP 层会自动把它注入请求，msite 页又做了缓存秒开、后台刷新。

难在这份状态有三个来源会打架：浏览器定位、用户手选城市、本地缓存。到底以谁为准、缓存什么时候失效，是这类功能的核心问题。相关记录见 `docs/reports/` 里定位下沉到 location store、msite 缓存秒开的两篇报告。

### 3. 支付回跳

涉及 `views/payment/payment.vue`、`views/payment/PaymentResult.vue`，走支付宝这种会跳出页面再跳回来的流程。

难点不在页面本身，而在人走了又回来：结果页要处理回跳、查单确认、重复进入，还要把请求并进全局 http 实例并处理静默错误。这种跨页面、依赖外部系统回调的流程，状态不在自己手里，是前端里最容易出幽灵 bug 的一类。

### 4. axios 封装

涉及 `services/http/request.js`，一个拦截器里叠了定位注入、token 注入、401 自动刷新、业务错误码识别和全局 loading。这些策略通过 `config.meta` 上的开关按请求开启，所以一次请求走哪些分支取决于调用方传了什么。

难在执行顺序和策略之间会互相踩，不是业务逻辑深。几个具体的点：401 刷新是一次重入（拿到新 token 后 `request(config)` 重放），要靠 `meta.authRetried` 防止无限循环，且刷新请求自身必须 `skipAuthRefresh`；`meta.silent` 只静默弹窗，不能误伤 401 刷新与跳登录；全局 loading 是引用计数（`startGlobalLoading` / `finishGlobalLoading`），凡是重入路径都要先 `finish` 再重发，否则计数永远归不了零；定位注入在 store 未就绪时要静默降级，不能把请求打死。

这是基础设施难：分支多、顺序敏感，改一个策略容易让另一个的行为变掉。管理端的 `apps/web-admin/src/shared/api/http.ts` 是另一个独立的封装，只做 token 注入、响应解包和错误回调，是常规写法，不算难点。

> 2026-10-02 更新：内存缓存、请求去重、失败重试三段策略已从该拦截器**剔除**——它们靠 `meta` 开关按请求开启，但全量排查确认 web-user 里从无任何接口开启过（详见 `docs/engineering/010-http-optional-policies.md`）。因此上面原本列出的「缓存命中靠 `USE_CACHE` 假错误走成功通道」「去重要合并调用方传入的 `signal`」「重试只对 GET、指数退避加抖动」这些顺序敏感点在 web-user 链路里已不存在，代码留档在 `services/http/extras/optional-policies.js`（未接入）。同一批策略在 `apps/uni-user` 的 transport 层另有一份**平台适配版**（错误判定改看 `TransportError`、定位改异步、去重依赖入口注册的 `AbortController` 垫片），同样暂无调用方。

### 5. 滚动位置恢复与 KeepAlive

涉及 `views/food/food.vue`。列表页进详情再返回要停在原位置，同时页面又被 KeepAlive 缓存，这两个机制会互相覆盖对方的行为，调对需要同时理解两边。相关记录见 food 滚动恢复精简与 KeepAlive 核查的报告。

登录、搜索、城市选择这些文件不小，但逻辑是线性的，难度低一档。`data/china-cities.ts` 有两万七千行，只是数据，不算功能难度。

## 管理端（apps/web-admin）

管理端的难点集中在服务端驱动的结构：菜单、权限这些运行时才确定的东西，怎么变成前端的路由和界面。

### 1. 动态路由与权限

涉及 `app/router`，其中 `permission.ts`，以及 `permission.test.ts`、`dynamic-routes.test.ts` 两份测试。

它做的是后端下发菜单、前端在运行时把菜单转成路由再注册进去。难在链路长而且每环都有约束：菜单数据要过 schema 校验和 adapter 归一化，`component` 字段只能映射到 `component-map` 里登记过的组件，路由还要能整体重置。这块的坑不是读一遍代码能看完的，动态路由组件映射 404、菜单禁用状态过滤该谁负责、menu-schema 一次遍历出两份产物，都在 `docs/reports/` 里有记录。

### 2. 权限树

涉及 `features/role-management/ui/RolePermissionPanel.vue`、`features/role-management/model/useRoleManagement.ts`。`RolePermissionPanel.vue` 是管理端最大的组件。

角色、菜单、部门三棵树互相引用，权限点要在树上勾选、半选、回显，树形勾选的状态计算本身就容易错。

### 3. 布局壳，主要是 TabBar

涉及 `widgets/admin-layout` 下的 TabBar、Sidebar、TopNavigation。

TabBar 一个组件前后有七八篇报告：滚动方案来回换、右键菜单定位、命令式状态归拢、事件载荷下沉。它难不是因为逻辑深，是因为一个组件同时管滚动、右键菜单、固定标签、KeepAlive，职责太密，动一处牵一片。

### 4. 商户入驻工作流

涉及 `pages/commerce/merchant-onboarding` 下的 `MerchantListPage.vue`、`MerchantDetailPage.vue`，走 `shared/workflow`。

多步骤、带审核状态流转的流程，比单页 CRUD 难。普通的增删改查已经用 config-crud 收敛掉了，所以纯 CRUD 那部分不算难点。

## 后端（apps/server）

后端的难点和前端是镜像关系：前端难在状态从哪来，后端难在状态怎么变才不出错。真正难的地方有个共同点，它们是带副作用的状态流转，而且副作用要么落在钱上，要么落在别的表上，要么落在控制不了的外部系统上。

### 1. 订单状态流转

涉及 `modules/order/order-workflow.service.ts` 和它的测试，旁边有一张 `OrderActionLog` 表。

要维护一张「当前状态 × 触发动作 → 下一个状态」的表，而且每一步都得同时满足几条约束：状态只能沿合法的边走，不能回头也不能跳步；每一次变更要落一条操作日志；还要挡得住并发，两个人同时接同一单只能有一个成功。

难度不在代码行数，在于得事先想清楚哪些状态和哪些边是真正需要的，多加一个状态，后面的合法边、日志、并发处理全得跟着长。这块的取舍见订单状态机的复盘。

### 2. 支付

涉及 `modules/payment/payment.service.ts` 和 `modules/payment/alipay/`，测试代码比实现还长。

难点有三层。一是回调不可靠：支付宝的通知可能迟到、重复，或者和用户浏览器的回跳同时到，所以处理必须幂等，同一笔通知来两次不能退两次款。二是金额和状态要对得上：支付单的状态、订单的状态、支付宝侧的状态是三份，任何一份落后都得有办法收敛。三是退款，`docs/refactor/real-alipay-refund-discussion/` 是把它当独立问题设计的。

### 3. 商户入驻

涉及 `modules/merchant-onboarding`，配了 `MerchantApplication` 和 `MerchantApplicationActionLog` 两张表。

它和订单流转是同一类难度，申请、审核、驳回、通过，每步有权限要求、有日志。更麻烦的一点是「通过」这个动作有副作用：审核通过时要真正创建租户和商家数据，而不只是改一个状态字段。一个动作跨好几张表，得放进事务里，中间任何一步失败都要整体回滚。

### 4. 认证与权限

涉及 `modules/auth/auth.service.ts`、`modules/admin/admin.service.ts`、`modules/admin/constants/admin-permissions.ts`，以及独立的 `modules/customer-auth`。

后端有两套独立的认证：管理端的 JWT、Passport、角色、菜单、部门，和用户端的顾客、短信验证码。一个请求能不能过，取决于守卫、角色、权限点、租户四层，而且管理端和用户端的规则不通用。改一处很容易让另一套的行为悄悄变掉。

## 不算难点的部分

划个边界。后端的 `customer-address`、`customer-avatar`、`storage`、`sms`、`notification` 是单表 CRUD 或薄薄一层外部调用，模式固定；`health`、`prisma`、`redis` 是基础设施封装；`admin-fallback-data.ts` 是数据不是逻辑。这些占了文件数的大部分，但难度都在上面几块之下。
