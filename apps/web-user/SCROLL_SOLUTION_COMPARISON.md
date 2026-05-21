# 滚动位置恢复 - msite vs food 差异说明

## 🔍 问题根源

### 路由结构差异

```
项目有两种不同的路由结构：

1. NavbarLayout 内部路由（如 msite）
   App.vue (KeepAlive)
   └── NavbarLayout.vue (KeepAlive) ← 缓存这里
       └── msite.vue ← 实际页面

2. 独立路由（如 food）
   App.vue (KeepAlive)
   └── food.vue ← 直接缓存这里
```

---

## 📊 两种方案对比

### 方案 A：msite（在 NavbarLayout 内）

**特点：**
- ✅ 被 `NavbarLayout` 内部的 KeepAlive 缓存
- ✅ 触发 `onActivated` / `onDeactivated`
- ❌ 实际滚动容器是 `.nav-page`（父级）
- ❌ 组件内部的 `useScrollPosition` 无法正确获取滚动容器

**解决方案：**
在 `NavbarLayout.vue` 中统一处理所有子路由的滚动位置：

```javascript
// src/layout/NavbarLayout.vue

// 保存滚动位置
onDeactivated(() => {
  const navPage = document.querySelector('.nav-page')
  sessionStorage.setItem('navbarLayoutScroll', String(navPage.scrollTop))
})

// 恢复滚动位置
onActivated(() => {
  const savedPosition = sessionStorage.getItem('navbarLayoutScroll')
  const navPage = document.querySelector('.nav-page')
  requestAnimationFrame(() => {
    navPage.scrollTop = Number(savedPosition)
  })
})
```

**优点：**
- 统一管理所有子路由的滚动位置
- 不需要在每个子组件中重复代码
- 自动处理 `.nav-page` 这个实际滚动容器

---

### 方案 B：food（独立路由）

**特点：**
- ✅ 被 `App.vue` 的 KeepAlive 直接缓存
- ✅ 触发 `onActivated` / `onDeactivated`
- ✅ 有自己的滚动容器 `.food-page`
- ❌ 不在 NavbarLayout 内，不受其管理

**解决方案：**
在 `food.vue` 中手动管理滚动位置：

```javascript
// src/views/food/food.vue

// 保存滚动位置
function saveScrollPosition() {
  if (foodPageRef.value) {
    const scrollPosition = foodPageRef.value.scrollTop
    sessionStorage.setItem('scroll:/food', String(scrollPosition))
  }
}

// 恢复滚动位置
function restoreScrollPosition() {
  const savedPosition = sessionStorage.getItem('scroll:/food')
  if (savedPosition && foodPageRef.value) {
    requestAnimationFrame(() => {
      foodPageRef.value.scrollTop = Number(savedPosition)
    })
  }
}

// KeepAlive 生命周期
onActivated(() => {
  restoreScrollPosition()
})

onDeactivated(() => {
  saveScrollPosition()
})
```

**优点：**
- 直接操作自己的滚动容器
- 不依赖外部布局
- 逻辑清晰，易于理解

---

## 🎯 关键区别总结

| 特性 | msite | food |
|------|-------|------|
| 路由类型 | NavbarLayout 子路由 | 独立路由 |
| KeepAlive 层级 | NavbarLayout 内部 | App.vue 直接缓存 |
| 滚动容器 | `.nav-page`（父级） | `.food-page`（自身） |
| 处理方式 | NavbarLayout 统一管理 | 组件内部管理 |
| 使用的钩子 | onActivated/onDeactivated | onActivated/onDeactivated |
| sessionStorage key | `navbarLayoutScroll` | `scroll:/food` |

---

## 🧪 测试验证

### 测试 msite

1. 访问 `/msite`
2. 滚动到中间位置
3. 点击进入商家详情
4. 点击返回
5. **预期**：恢复到之前的位置
6. **控制台日志**：
   ```
   [NavbarLayout] Deactivated
   [NavbarLayout] Saved scroll position: 1250

   [NavbarLayout] Activated
   [NavbarLayout] Restored scroll position: 1250 current: 1250
   ```

### 测试 food

1. 访问 `/food?FoodTitle=快餐&restaurant_category_id=123`
2. 滚动到中间位置
3. 点击进入商家详情
4. 点击返回
5. **预期**：恢复到之前的位置
6. **控制台日志**：
   ```
   [Food] Deactivated
   [Food] Saved scroll position: 800

   [Food] Activated
   [Food] Restored scroll position: 800 current: 800
   ```

---

## 💡 为什么不能统一使用 useScrollPosition？

### 问题分析

`useScrollPosition` composable 的设计假设：
1. 组件自己就是滚动容器，或者
2. 通过 ref 传入滚动容器

但在我们的项目中：

**msite 的问题：**
```javascript
// ❌ 错误的方式
const msiteRef = useTemplateRef('msiteRef')
useScrollPosition(msiteRef)

// 问题：实际滚动的是 .nav-page，不是 .msite
// msiteRef.value.scrollTop 永远是 0
```

**food 的问题：**
```javascript
// ❌ 之前的方式
useScrollPosition(foodPageRef)

// 问题：onBeforeRouteLeave 可能不会正确触发
// 因为 food 是独立路由，路由守卫的执行顺序不同
```

### 正确的做法

**对于 NavbarLayout 内的页面：**
- 在 NavbarLayout 层面统一处理
- 操作 `.nav-page` 这个实际滚动容器

**对于独立路由：**
- 在组件内部直接处理
- 使用 `onActivated` / `onDeactivated` 而不是 `onBeforeRouteLeave`

---

## 🔧 如何判断一个页面应该用哪种方案？

### 检查步骤

1. **查看路由配置**
   ```javascript
   // 情况 A：有 children，在 layout 内
   {
     path: '/msite',
     component: () => import('@/layout/NavbarLayout.vue'),
     children: [
       { path: '', component: () => import('@/views/msite/msite.vue') }
     ]
   }

   // 情况 B：独立路由
   {
     path: '/food',
     component: () => import('@/views/food/food.vue')
   }
   ```

2. **检查是否有 .nav-page 元素**
   ```javascript
   // 在浏览器控制台执行
   document.querySelector('.nav-page')

   // 如果返回 null → 使用方案 B（组件内部管理）
   // 如果返回元素 → 使用方案 A（NavbarLayout 管理）
   ```

3. **检查滚动容器**
   ```javascript
   // 滚动页面后，在控制台执行
   document.querySelector('.nav-page')?.scrollTop
   document.querySelector('.food-page')?.scrollTop

   // 哪个有值，哪个就是实际滚动容器
   ```

---

## 📝 最佳实践建议

### 1. 保持一致性

如果可能，尽量让所有页面都使用相同的结构：

**选项 A：全部放在 NavbarLayout 内**
```javascript
// 修改 food 路由
{
  path: '/food',
  component: () => import('@/layout/NavbarLayout.vue'),
  children: [
    {
      path: '',
      name: 'Food',
      component: () => import('@/views/food/food.vue'),
      meta: { keepAlive: true }
    }
  ]
}
```

**选项 B：全部作为独立路由**
- 移除 NavbarLayout 的 KeepAlive
- 每个页面自己管理滚动位置

### 2. 创建统一的 Hook

可以创建一个更智能的 `useScrollPosition`：

```javascript
export function useScrollPosition(containerRef = null) {
  const route = useRoute()

  // 自动检测是否在 NavbarLayout 内
  const isInNavbarLayout = computed(() => {
    return route.matched.some(r => r.name === 'NavbarLayout')
  })

  onActivated(() => {
    if (isInNavbarLayout.value) {
      // 由 NavbarLayout 处理，跳过
      return
    }

    // 独立路由，自己处理
    restoreScrollPosition(containerRef)
  })

  onDeactivated(() => {
    if (isInNavbarLayout.value) {
      // 由 NavbarLayout 处理，跳过
      return
    }

    // 独立路由，自己处理
    saveScrollPosition(containerRef)
  })
}
```

### 3. 添加调试工具

在开发环境下，添加全局调试函数：

```javascript
// main.js
if (import.meta.env.DEV) {
  window.debugScroll = () => {
    console.log('NavbarLayout scroll:', document.querySelector('.nav-page')?.scrollTop)
    console.log('Food page scroll:', document.querySelector('.food-page')?.scrollTop)
    console.log('SessionStorage:', {
      navbarLayoutScroll: sessionStorage.getItem('navbarLayoutScroll'),
      foodScroll: sessionStorage.getItem('scroll:/food'),
    })
  }
}

// 在控制台执行 debugScroll() 查看状态
```

---

## 🎓 总结

**核心原则：**
1. **找到真正的滚动容器**（可能是父级元素）
2. **在正确的层级处理**（布局层 or 组件层）
3. **使用 KeepAlive 的生命周期**（onActivated/onDeactivated）
4. **使用 requestAnimationFrame** 确保 DOM 更新后再滚动

**记住：**
- msite 在 NavbarLayout 内 → NavbarLayout 管理
- food 是独立路由 → 自己管理
- 不要混用两种方案

---

**最后更新**：2026-05-02
**相关文件**：
- `src/layout/NavbarLayout.vue` - msite 等页面的滚动管理
- `src/views/food/food.vue` - food 页面的滚动管理
- `src/composables/useScrollPosition.js` - 通用方案（当前未使用）
