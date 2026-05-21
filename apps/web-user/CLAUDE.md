# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vue 3 mobile app template modeled after ELM (Ele.me) food delivery service. Built with Vite, Vue 3, Vant UI, and Pinia. Uses JavaScript (with `.js` files), SCSS, and module-based architecture.

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server (proxy to elm.cangdu.org)
pnpm dev

# Development server with mock data enabled
pnpm dev:mock

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code with auto-fix
pnpm lint

# Format code with Prettier
pnpm format
```

## Architecture

### Routing (Module-Based)
- Routes are defined in `src/router/modules/*.js` files
- Main router configuration in `src/router/index.js` auto-imports all module files using `import.meta.glob`
- Uses `createWebHashHistory()` for hash-based routing
- Implements `router.beforeEach` and `afterEach` hooks with NProgress
- Router modules export route configurations as arrays or objects

### State Management (Pinia)
- Global Pinia store configured in `src/stores/index.js`
- Store modules located in `src/stores/modules/`
- State persistence via `pinia-plugin-persistedstate`
- Main store modules:
  - `store-user.js` - User authentication and profile with caching
  - `store-address.js` - Address management
  - `store-locations.js` - Geolocation data
  - `store-loading.js` - Loading state management
- Global store registration via `registStore(app)` in `main.js`
- Stores use composition API style with `defineStore()`

### API Services
- API endpoints organized by feature in `src/services/api/`
- Centralized HTTP client in `src/services/http/http.js`
  - Axios instance with request/response interceptors
  - Automatic latitude/longitude injection from location store
  - Loading state management integration
  - Error handling with alerts
- Base URL proxied to `https://elm.cangdu.org` (proxy configured in `vite.config.js`)
- Feature API modules: address, msite, search, home, food, shop, login, city, forget, download

### Views (Feature-Based)
- Feature modules in `src/views/`:
  - `home/` - Homepage
  - `food/` - Food-related pages with sub-components
  - `shop/` - Shop details
  - `msite/` - Main location page
  - `profile/` - User profile
  - `login/` - Login/signup pages
  - `search/` - Search functionality
  - `city/` - City selection
  - `forget/` - Password recovery
  - `download/` - App download

### Components
- Global components registered in `main.js`:
  - `HeadTop` - Header component
  - `FootGuide` - Bottom navigation guide
  - `SvgIcon` - SVG icon wrapper
- Components organized in `src/components/`
- Auto-import enabled for Vant components via `unplugin-vue-components`
- Shared components: `AlterTip`, `ConfirmDialog`, `Loding`, `ShopList`

### Composables
- Reusable composition functions in `src/composables/`
- Includes: `useAlert`, `usePageTitle`, `useScrollPosition`, `usePageScroll`, `useBackTop`

### Directives
- Custom Vue directives in `src/directives/`
- Lazy loading directive registered globally in `main.js`

### Utilities
- Helper functions in `src/untils/`:
  - `storage.js` - localStorage wrapper (`setStore`, `getStore`, `removeStore`)
  - `format.js` - Formatting utilities
  - `device-detector.js` - Device detection
  - `SearchHistory.ts` - Search history management

### Mock Data
- Mock endpoints defined in `mock/` directory
- Mock server enabled in development via `vite-plugin-mock`
- Configuration in `vite.config.js` (localEnabled: true, prodEnabled: false)
- Mock files use JS/TS files

### Styling
- SCSS with global imports in `vite.config.js`:
  - `@/assets/styles/mixins.scss`
  - `@/assets/styles/variables.scss`
- Uses SCSS variables for consistent theming
- Common mixins for styling utilities

## Key Configuration

### Vite Configuration
- `@/` alias mapped to `src/` directory
- SVG icons plugin configured with `src/icons/svg`
- Proxy `/api` requests to `https://elm.cangdu.org`
- Auto-import for Vant components via `VantResolver`
- SCSS global imports for mixins and variables

### ESLint
- Vue 3 with ES modules
- Auto-fix enabled in lint command
- Ignores `dist/`, `dist-ssr/`, `coverage/` directories
- Multi-word component names allowed (rule disabled)
- No semicolons required

### Prettier
- No semicolons
- Single quotes
- 100 character line width

## Important Patterns

### HTTP Request Pattern
- All API calls go through `src/services/http/http.js`
- Export convenience functions: `get()`, `post()`
- API modules export named functions like `getFoodCategory()`
- Store modules import API functions from `@/services/api`

### Location Handling
- `store-locations.js` manages latitude/longitude
- Automatically injected into API requests via axios interceptor
- Critical for all location-based features (food, shop, search)

### Store Pattern
- Use composition API style with `defineStore()`
- Export all state, getters, and actions from store definition
- Auto-initialization: `fetchUserInfo()` called in store constructor

### Router Module Pattern
- Each feature has a module file in `src/router/modules/`
- Export route configuration as array or object
- Router auto-imports all modules using `import.meta.glob`
- Add to constant routes in `src/router/index.js` if needed

### Styling Pattern
- SCSS files in component directories can import global mixins
- Use `@import "@/assets/styles/variables.scss"` for theme variables
- Use `@import "@/assets/styles/mixins.scss"` for utility mixins
