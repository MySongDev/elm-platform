// NavbarLayout 向其路由子页面提供动态 Header 的控制入口。
// 子页面只提交标题/操作配置，不直接依赖 HeadTop；ownerRoute 用于隔离 KeepAlive 页面之间的旧状态。
export const navbarHeaderContextKey = Symbol('navbar-header-context')
