/* eslint-disable */
/**
 * @elm-platform/api-types
 *
 * This file is auto-generated from the OpenAPI spec.
 * Run `pnpm api:generate` to regenerate.
 */

export interface paths {
    "/api/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 服务健康检查 */
        get: operations["HealthController_check"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取所有用户 */
        get: operations["UserController_findAll"];
        put?: never;
        /** 创建用户 */
        post: operations["UserController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 根据 ID 获取用户 */
        get: operations["UserController_findOne"];
        put?: never;
        post?: never;
        /** 删除用户 */
        delete: operations["UserController_remove"];
        options?: never;
        head?: never;
        /** 更新用户 */
        patch: operations["UserController_update"];
        trace?: never;
    };
    "/api/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 用户登录 */
        post: operations["AuthController_login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取当前用户信息 */
        get: operations["AuthController_getProfile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 更新当前用户信息 */
        patch: operations["AuthController_updateProfile"];
        trace?: never;
    };
    "/api/auth/menus": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取当前用户可访问的菜单树 */
        get: operations["AuthController_getMenus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 退出登录 */
        post: operations["AuthController_logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/security-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取安全日志 */
        get: operations["AuthController_getSecurityLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取当前管理员通知列表 */
        get: operations["NotificationController_list"];
        put?: never;
        post?: never;
        /** 按类型清空通知 */
        delete: operations["NotificationController_clear"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/notifications/read-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 按类型批量标记已读 */
        patch: operations["NotificationController_markAllRead"];
        trace?: never;
    };
    "/api/admin/notifications/{id}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 标记单条通知已读 */
        patch: operations["NotificationController_markRead"];
        trace?: never;
    };
    "/api/admin/notifications/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 删除单条通知 */
        delete: operations["NotificationController_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/tenants": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 租户列表 */
        get: operations["TenantController_listTenants"];
        put?: never;
        /** 创建租户 */
        post: operations["TenantController_createTenant"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/tenants/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 租户详情 */
        get: operations["TenantController_getTenantDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** 更新租户 */
        patch: operations["TenantController_updateTenant"];
        trace?: never;
    };
    "/api/admin/tenants/{id}/events/{event}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 触发租户状态事件 */
        post: operations["TenantController_transitionTenant"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/tenants/{id}/action-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 租户状态动作日志 */
        get: operations["TenantController_getTenantActionLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/customer-auth/sms/send": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 发送短信验证码 */
        post: operations["CustomerAuthController_sendSms"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/customer-auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 手机号注册 */
        post: operations["CustomerAuthController_register"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/customer-auth/login/password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 手机号密码登录 */
        post: operations["CustomerAuthController_loginByPassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/customer-auth/login/sms": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 手机号验证码登录 */
        post: operations["CustomerAuthController_loginBySms"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/customer-auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 刷新用户端访问令牌 */
        post: operations["CustomerAuthController_refresh"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/customer-auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 撤销用户端刷新令牌 */
        post: operations["CustomerAuthController_logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/customer-auth/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取普通用户信息 */
        get: operations["CustomerAuthController_getProfile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/permissions/pages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 页面权限列表 */
        get: operations["AdminController_getPagePermissions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/permissions/buttons": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 按钮权限列表 */
        get: operations["AdminController_getButtonPermissions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/monitor/online-users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 在线用户列表 */
        get: operations["AdminController_getOnlineUsers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/monitor/online-users/{id}/force-logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 强制用户下线 */
        post: operations["AdminController_forceLogout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/monitor/login-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 登录日志 */
        get: operations["AdminController_getLoginLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/monitor/operation-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 操作日志 */
        get: operations["AdminController_getOperationLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/monitor/system-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 系统日志 */
        get: operations["AdminController_getSystemLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/system/roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 角色列表 */
        get: operations["AdminController_getRoles"];
        put?: never;
        /** 创建角色 */
        post: operations["AdminController_createRole"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/system/roles/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 删除角色 */
        delete: operations["AdminController_deleteRole"];
        options?: never;
        head?: never;
        /** 更新角色 */
        patch: operations["AdminController_updateRole"];
        trace?: never;
    };
    "/api/admin/system/menus": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 菜单列表 */
        get: operations["AdminController_getMenus"];
        put?: never;
        /** 创建菜单 */
        post: operations["AdminController_createMenu"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/system/menus/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 删除菜单 */
        delete: operations["AdminController_deleteMenu"];
        options?: never;
        head?: never;
        /** 更新菜单 */
        patch: operations["AdminController_updateMenu"];
        trace?: never;
    };
    "/api/admin/system/depts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 部门列表 */
        get: operations["AdminController_getDepts"];
        put?: never;
        /** 创建部门 */
        post: operations["AdminController_createDept"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/system/depts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 删除部门 */
        delete: operations["AdminController_deleteDept"];
        options?: never;
        head?: never;
        /** 更新部门 */
        patch: operations["AdminController_updateDept"];
        trace?: never;
    };
    "/api/v1/cities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取城市列表 */
        get: operations["ElmLocationController_getCities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cities/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取城市信息 */
        get: operations["ElmLocationController_getCity"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/pois": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 搜索地址 */
        get: operations["ElmLocationController_searchPois"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/pois": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 根据经纬度详细定位（query） */
        get: operations["ElmLocationController_getPoiByQuery"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/pois/{geohash}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 根据经纬度详细定位（param） */
        get: operations["ElmLocationController_getPoiByParam"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/restapi/bgs/poi/reverse_geo_coding": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 逆地理编码兼容接口 */
        get: operations["ElmLocationController_reverseGeoCoding"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/index_entry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 食品分类列表 */
        get: operations["ElmLocationController_getIndexEntry"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping/restaurants": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取商铺列表 */
        get: operations["ElmRestaurantPublicController_getRestaurants"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping/restaurants/count": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取餐馆数量 */
        get: operations["ElmRestaurantPublicController_getRestaurantCount"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v4/restaurants": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 搜索餐馆 */
        get: operations["ElmRestaurantPublicController_searchRestaurants"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping/v2/restaurant/category": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 商铺分类列表 */
        get: operations["ElmRestaurantPublicController_getRestaurantCategories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping/v1/restaurants/delivery_modes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 配送方式列表 */
        get: operations["ElmRestaurantPublicController_getDeliveryModes"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping/v1/restaurants/activity_attributes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 商家属性活动列表 */
        get: operations["ElmRestaurantPublicController_getActivityAttributes"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping/restaurant/{shopId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 餐馆详情 */
        get: operations["ElmRestaurantPublicController_getRestaurant"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping/addshop": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 添加餐馆 */
        post: operations["ElmRestaurantPublicController_addRestaurant"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping/updateshop": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 更新餐馆 */
        post: operations["ElmRestaurantPublicController_updateRestaurant"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping/restaurant/{restaurantId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 删除餐馆 */
        delete: operations["ElmRestaurantPublicController_deleteRestaurant"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping/v2/menu": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取菜单列表 */
        get: operations["ElmFoodPublicController_getMenu"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping/getcategory/{restaurantId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取店铺食品种类 */
        get: operations["ElmFoodPublicController_getFoodCategories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping/v2/menu/{categoryId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取食品种类详情 */
        get: operations["ElmFoodPublicController_getFoodCategoryDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping/v2/foods": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取食品列表 */
        get: operations["ElmFoodPublicController_getFoods"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping/v2/foods/count": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取食品数量 */
        get: operations["ElmFoodPublicController_getFoodCount"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping/v2/addfood": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 添加食品 */
        post: operations["ElmFoodPublicController_addFood"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping/v2/updatefood": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 更新食品 */
        post: operations["ElmFoodPublicController_updateFood"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/shopping/v2/food/{foodId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 删除食品 */
        delete: operations["ElmFoodPublicController_deleteFood"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ugc/v2/restaurants/{restaurantId}/ratings/tags": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 评价分类 */
        get: operations["ElmFoodPublicController_getRatingTags"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ugc/v2/restaurants/{restaurantId}/ratings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 评价列表 */
        get: operations["ElmFoodPublicController_getRatings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/captchas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 获取验证码 */
        post: operations["ElmUserPublicController_getCaptchas"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 账号密码登录 */
        post: operations["ElmUserPublicController_login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/login/app_mobile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 手机号登录 */
        post: operations["ElmUserPublicController_mobileLogin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/user": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取用户信息 */
        get: operations["ElmUserPublicController_getUser"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/changepassword": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 修改密码 */
        post: operations["ElmUserPublicController_changePassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/signout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 退出登录 */
        get: operations["ElmUserPublicController_signout"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/users/{userId}/addresses": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 获取收货地址列表 */
        get: operations["ElmUserPublicController_getAddresses"];
        put?: never;
        /** 新增收货地址 */
        post: operations["ElmUserPublicController_addAddress"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/users/{userId}/addresses/{addressId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 删除收货地址 */
        delete: operations["ElmUserPublicController_deleteAddress"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/eus/v1/users/{userId}/avatar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 上传用户头像 */
        post: operations["ElmUserPublicController_uploadAvatar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/bos/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 订单列表 */
        get: operations["ElmOrderPublicController_getOrders"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/bos/orders/count": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 订单数量 */
        get: operations["ElmOrderPublicController_getOrderCount"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/commerce/restaurants": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 管理端餐馆列表 */
        get: operations["ElmAdminController_getRestaurants"];
        put?: never;
        /** 管理端创建餐馆 */
        post: operations["ElmAdminController_createRestaurant"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/commerce/restaurants/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 管理端删除餐馆 */
        delete: operations["ElmAdminController_deleteRestaurant"];
        options?: never;
        head?: never;
        /** 管理端更新餐馆 */
        patch: operations["ElmAdminController_updateRestaurant"];
        trace?: never;
    };
    "/api/admin/commerce/foods": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 管理端食品列表 */
        get: operations["ElmAdminController_getFoods"];
        put?: never;
        /** 管理端创建食品 */
        post: operations["ElmAdminController_createFood"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/commerce/foods/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** 管理端删除食品 */
        delete: operations["ElmAdminController_deleteFood"];
        options?: never;
        head?: never;
        /** 管理端更新食品 */
        patch: operations["ElmAdminController_updateFood"];
        trace?: never;
    };
    "/api/admin/commerce/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 管理端真实支付订单列表 */
        get: operations["ElmAdminController_getOrders"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/commerce/orders/{orderNo}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 管理端订单详情 */
        get: operations["ElmAdminController_getOrderDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/commerce/orders/{orderNo}/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 管理端订单接单 */
        post: operations["ElmAdminController_acceptOrder"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/commerce/orders/{orderNo}/start-preparing": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 管理端订单开始制作 */
        post: operations["ElmAdminController_startPreparing"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/commerce/orders/{orderNo}/start-delivery": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 管理端订单开始配送 */
        post: operations["ElmAdminController_startDelivery"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/commerce/orders/{orderNo}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 管理端订单完成 */
        post: operations["ElmAdminController_completeOrder"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/commerce/orders/{orderNo}/refund/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 管理端同意退款 */
        post: operations["ElmAdminController_approveRefund"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/commerce/orders/{orderNo}/refund/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 管理端驳回退款 */
        post: operations["ElmAdminController_rejectRefund"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/payments/alipay/wap/create": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 创建支付宝 WAP 支付单 */
        post: operations["PaymentController_createAlipayWapPayment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/payments/alipay/wap/resume": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 继续支付宝 WAP 支付单 */
        post: operations["PaymentController_resumeAlipayWapPayment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/payments/alipay/status/{orderNo}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 查询支付宝支付状态 */
        get: operations["PaymentController_getAlipayPaymentStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/orders/{orderNo}/refund/request": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 用户申请订单退款 */
        post: operations["PaymentController_requestRefund"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/payments/alipay/notify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** 支付宝异步通知 */
        post: operations["PaymentController_handleAlipayNotify"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 用户支付订单列表 */
        get: operations["PaymentController_listOrders"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/merchant-applications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Merchant application list */
        get: operations["MerchantOnboardingController_listApplications"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/merchant-applications/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Merchant application detail */
        get: operations["MerchantOnboardingController_getApplicationDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/merchant-applications/{id}/review": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Review merchant application */
        post: operations["MerchantOnboardingController_reviewApplication"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/merchant-applications/{id}/action-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Merchant application action logs */
        get: operations["MerchantOnboardingController_getApplicationActionLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ApiErrorResponseDto: {
            /**
             * @description HTTP 错误状态码
             * @example 400
             */
            code: number;
            /**
             * @description 错误原因
             * @example 请求参数错误
             */
            message: string;
            /**
             * Format: date-time
             * @description 错误发生时间，ISO 8601 格式
             * @example 2026-07-01T08:00:00.000Z
             */
            timestamp: string;
            /**
             * @description 请求路径
             * @example /api/users/1
             */
            path: string;
        };
        ApiResponseEnvelopeDto: {
            /**
             * @description 业务成功码，固定为 200
             * @example 200
             */
            code: number;
            /**
             * @description 响应消息
             * @example success
             */
            message: string;
            /**
             * Format: date-time
             * @description 响应时间，ISO 8601 格式
             * @example 2026-07-01T08:00:00.000Z
             */
            timestamp: string;
        };
        HealthDependencyResponseDto: {
            /**
             * @description 依赖状态
             * @example ok
             * @enum {string}
             */
            status: "ok" | "error";
            /**
             * @description 详细说明
             * @example SELECT 1 ok
             */
            detail: string;
        };
        HealthDependenciesResponseDto: {
            /** @description 数据库状态 */
            database: components["schemas"]["HealthDependencyResponseDto"];
            /** @description Redis 状态 */
            redis: components["schemas"]["HealthDependencyResponseDto"];
        };
        HealthResponseDto: {
            /**
             * @description 服务状态
             * @example ok
             * @enum {string}
             */
            status: "ok" | "degraded";
            /**
             * Format: date-time
             * @description 检查时间
             * @example 2026-07-01T00:00:00.000Z
             */
            timestamp: string;
            /**
             * @description 运行时长（秒）
             * @example 3600
             */
            uptime: number;
            /** @description 依赖状态 */
            dependencies: components["schemas"]["HealthDependenciesResponseDto"];
        };
        UserResponseDto: {
            /**
             * @description 用户 ID
             * @example 1
             */
            id: number;
            /**
             * @description 用户名
             * @example admin
             */
            username: string;
            /**
             * @description 邮箱
             * @example admin@example.com
             */
            email: string | null;
            /**
             * @description 手机号
             * @example 13800138000
             */
            phone: string | null;
            /** @description 头像 */
            avatar: string | null;
            /**
             * @description 状态：1 启用 0 停用
             * @example 1
             */
            status: number;
            /**
             * @description 角色
             * @example admin
             */
            role: string;
            /**
             * @description 权限列表
             * @example [
             *       "*:*:*"
             *     ]
             */
            permissions: string[];
            /**
             * @description 租户 ID
             * @example 1
             */
            tenantId: number | null;
            /**
             * @description 数据范围
             * @example ALL
             */
            dataScope: string;
            /**
             * @description 绑定的店铺 ID 列表
             * @example [
             *       "shop-1"
             *     ]
             */
            boundShopIds: string[];
            /**
             * Format: date-time
             * @description 创建时间
             */
            createdAt: string;
            /**
             * Format: date-time
             * @description 更新时间
             */
            updatedAt: string;
        };
        CreateUserDto: {
            /**
             * @description 用户名
             * @example john_doe
             */
            username: string;
            /**
             * @description 密码
             * @example password123
             */
            password: string;
            /**
             * @description 邮箱
             * @example john@example.com
             */
            email?: string;
            /**
             * @description 手机号
             * @example 13800138000
             */
            phone?: string;
            /**
             * @description 角色
             * @example user
             */
            role?: string;
            /**
             * @description 状态
             * @example 1
             */
            status?: number;
            /**
             * @description 权限码
             * @example [
             *       "user:view"
             *     ]
             */
            permissions?: string[];
            /**
             * @description 所属租户 ID
             * @example 1
             */
            tenantId?: Record<string, never>;
            /**
             * @description 数据范围
             * @example TENANT
             */
            dataScope?: string;
            /**
             * @description 绑定店铺 ID 列表
             * @example [
             *       "1"
             *     ]
             */
            boundShopIds?: string[];
        };
        UpdateUserDto: {
            /**
             * @description 用户名
             * @example john_doe
             */
            username?: string;
            /**
             * @description 邮箱
             * @example john@example.com
             */
            email?: string;
            /**
             * @description 手机号
             * @example 13800138000
             */
            phone?: string;
            /**
             * @description 角色
             * @example user
             */
            role?: string;
            /**
             * @description 状态
             * @example 1
             */
            status?: number;
            /**
             * @description 权限码
             * @example [
             *       "user:view"
             *     ]
             */
            permissions?: string[];
            /**
             * @description 所属租户 ID
             * @example 1
             */
            tenantId?: Record<string, never>;
            /**
             * @description 数据范围
             * @example TENANT
             */
            dataScope?: string;
            /**
             * @description 绑定店铺 ID 列表
             * @example [
             *       "1"
             *     ]
             */
            boundShopIds?: string[];
        };
        LoginTenantDto: {
            /** @example 1 */
            id: number;
            /** @example default */
            code: string;
            /** @example Default Tenant */
            name: string;
            /** @example ACTIVE */
            status: string;
        };
        LoginUserDto: {
            /** @example 1 */
            id: number;
            /** @example admin */
            username: string;
            /** @example admin@example.com */
            email: string | null;
            /** @example 13800138000 */
            phone: string | null;
            /** @example null */
            avatar: string | null;
            /** @example 1 */
            status: number;
            /**
             * @example admin
             * @enum {string}
             */
            role: "admin" | "user";
            /**
             * @example [
             *       "*:*:*"
             *     ]
             */
            permissions: string[];
            tenant: components["schemas"]["LoginTenantDto"] | null;
            /** @example ALL */
            dataScope: string;
            /**
             * @example [
             *       "shop-1"
             *     ]
             */
            boundShopIds: string[];
        };
        LoginResponseDto: {
            /** @example jwt-token */
            token: string;
            /** @example 86400 */
            expiresIn: number;
            user: components["schemas"]["LoginUserDto"];
        };
        LoginDto: {
            /**
             * @description 用户名或手机号
             * @example admin
             */
            account: string;
            /**
             * @description 兼容旧字段：用户名
             * @example admin
             */
            username?: string;
            /**
             * @description 密码
             * @example 123456
             */
            password: string;
            /**
             * @description 是否签发 7 天免登录 token
             * @example true
             */
            rememberMe?: boolean;
        };
        AdminTenantResponseDto: {
            /**
             * @description 租户ID
             * @example 1
             */
            id: number;
            /**
             * @description 租户编码
             * @example default
             */
            code: string;
            /**
             * @description 租户名称
             * @example Default Tenant
             */
            name: string;
            /**
             * @description 租户状态
             * @example ACTIVE
             */
            status: string;
        };
        AdminProfileResponseDto: {
            /**
             * @description 用户ID
             * @example 1
             */
            id: number;
            /**
             * @description 用户名
             * @example admin
             */
            username: string;
            /**
             * @description 邮箱
             * @example admin@example.com
             */
            email: string | null;
            /**
             * @description 手机号
             * @example 13800138000
             */
            phone: string | null;
            /** @description 头像 */
            avatar: string | null;
            /**
             * @description 状态：1 启用 0 停用
             * @example 1
             */
            status: number;
            /**
             * @description 角色
             * @example admin
             * @enum {string}
             */
            role: "admin" | "user";
            /**
             * @description 权限列表
             * @example [
             *       "*:*:*"
             *     ]
             */
            permissions: string[];
            /**
             * @description 数据范围
             * @example ALL
             */
            dataScope: string;
            /**
             * @description 绑定的店铺ID列表
             * @example [
             *       "shop-1"
             *     ]
             */
            boundShopIds: string[];
            /** @description 所属租户 */
            tenant: components["schemas"]["AdminTenantResponseDto"] | null;
            /**
             * Format: date-time
             * @description 创建时间
             */
            createdAt: string;
            /**
             * Format: date-time
             * @description 更新时间
             */
            updatedAt: string;
        };
        AdminMenuResponseDto: {
            /**
             * @description 菜单ID
             * @example 1
             */
            id: number;
            /** @description 父菜单ID */
            parentId: number | null;
            /**
             * @description 菜单标题
             * @example 用户管理
             */
            title: string;
            /**
             * @description 菜单路径
             * @example /system/user
             */
            path: string;
            /** @description 路由名称 */
            name: string | null;
            /** @description 图标 */
            icon: string | null;
            /** @description 权限标识 */
            permission: string | null;
            /**
             * @description 菜单类型
             * @example menu
             * @enum {string}
             */
            type: "catalog" | "menu" | "button";
            /**
             * @description 排序号
             * @example 1
             */
            sort: number;
            /**
             * @description 状态：1 启用 0 停用
             * @example 1
             */
            status: number;
            /** @description 子菜单列表 */
            children?: components["schemas"]["AdminMenuResponseDto"][];
        };
        AdminUpdatedProfileResponseDto: {
            /**
             * @description 用户ID
             * @example 1
             */
            id: number;
            /**
             * @description 用户名
             * @example admin
             */
            username: string;
            /**
             * @description 邮箱
             * @example admin@example.com
             */
            email: string | null;
            /**
             * @description 手机号
             * @example 13800138000
             */
            phone: string | null;
            /** @description 头像 */
            avatar: string | null;
            /**
             * @description 状态：1 启用 0 停用
             * @example 1
             */
            status: number;
            /**
             * @description 角色
             * @example admin
             * @enum {string}
             */
            role: "admin" | "user";
            /**
             * @description 权限列表
             * @example [
             *       "*:*:*"
             *     ]
             */
            permissions: string[];
            /**
             * Format: date-time
             * @description 创建时间
             */
            createdAt: string;
            /**
             * Format: date-time
             * @description 更新时间
             */
            updatedAt: string;
        };
        UpdateProfileDto: {
            /**
             * @description 用户名
             * @example john_doe
             */
            username?: string;
            /**
             * @description 邮箱
             * @example john@example.com
             */
            email?: Record<string, never>;
            /**
             * @description 手机号
             * @example 13800138000
             */
            phone?: Record<string, never>;
        };
        SecurityLogItemResponseDto: {
            /**
             * @description 日志ID
             * @example 1
             */
            id: number;
            /**
             * @description 用户ID
             * @example 1
             */
            userId: number;
            /**
             * @description IP地址
             * @example 127.0.0.1
             */
            ip: Record<string, never>;
            /**
             * @description 浏览器
             * @example Chrome
             */
            browser: string;
            /**
             * @description 操作系统
             * @example Windows
             */
            os: string;
            /**
             * @description 状态：1 成功 0 失败
             * @example 1
             */
            status: number;
            /**
             * @description 登录结果消息，如登录成功、密码错误
             * @example 登录成功
             */
            message: Record<string, never>;
            /**
             * Format: date-time
             * @description 创建时间
             */
            createdAt: string;
        };
        SecurityLogsResponseDto: {
            /** @description 日志列表 */
            list: components["schemas"]["SecurityLogItemResponseDto"][];
            /**
             * @description 总记录数
             * @example 100
             */
            total: number;
            /**
             * @description 当前页码
             * @example 1
             */
            page: number;
            /**
             * @description 每页条数
             * @example 10
             */
            pageSize: number;
        };
        NotificationItemResponseDto: {
            /**
             * @description 通知 ID
             * @example cuid-001
             */
            id: string;
            /**
             * @description 用户 ID
             * @example 1
             */
            userId: number;
            /**
             * @description 通知类型
             * @example notification
             * @enum {string}
             */
            type: "notification" | "message" | "todo";
            /**
             * @description 标题
             * @example 安全登录提醒
             */
            title: string;
            /**
             * @description 描述内容
             * @example 127.0.0.1（Chrome / Windows）
             */
            description: string | null;
            /**
             * @description 是否已读
             * @example false
             */
            read: boolean;
            /**
             * @description 来源
             * @example SECURITY_LOGIN
             */
            source: string;
            /**
             * Format: date-time
             * @description 创建时间
             */
            createdAt: string;
            /**
             * Format: date-time
             * @description 更新时间
             */
            updatedAt: string;
        };
        UpdatedCountResponseDto: {
            /**
             * @description 已更新通知数量
             * @example 5
             */
            updatedCount: number;
        };
        MarkAllReadDto: Record<string, never>;
        NotificationSuccessResponseDto: {
            /**
             * @description 是否成功
             * @example true
             */
            success: boolean;
        };
        DeletedCountResponseDto: {
            /**
             * @description 已删除通知数量
             * @example 10
             */
            deletedCount: number;
        };
        TenantResponseDto: {
            /**
             * @description 租户 ID
             * @example 1
             */
            id: number;
            /**
             * @description 租户编码
             * @example default
             */
            code: string;
            /**
             * @description 租户名称
             * @example Default Tenant
             */
            name: string;
            /**
             * @description 租户状态
             * @example ACTIVE
             * @enum {string}
             */
            status: "PENDING" | "ACTIVE" | "SUSPENDED" | "DISABLED" | "EXPIRED" | "ARCHIVED";
            /**
             * @description 联系人姓名
             * @example 张三
             */
            contactName: string | null;
            /**
             * @description 联系人电话
             * @example 13800138000
             */
            contactPhone: string | null;
            /**
             * @description 联系人邮箱
             * @example contact@example.com
             */
            contactEmail: string | null;
            /**
             * @description 套餐编码
             * @example standard
             */
            planCode: string;
            /**
             * @description 租户设置
             * @example {}
             */
            settings: Record<string, never> | null;
            /**
             * @description 备注
             * @example 测试租户
             */
            remark: string | null;
            /**
             * Format: date-time
             * @description 创建时间
             */
            createdAt: string;
            /**
             * Format: date-time
             * @description 更新时间
             */
            updatedAt: string;
            /**
             * @description 可用操作
             * @example [
             *       "SUSPEND",
             *       "DISABLE"
             *     ]
             */
            availableActions: string[];
        };
        CreateTenantDto: Record<string, never>;
        TenantCountResponseDto: {
            /**
             * @description 用户数
             * @example 5
             */
            users: number;
            /**
             * @description 订单数
             * @example 100
             */
            orders: number;
        };
        TenantDetailResponseDto: {
            /**
             * @description 租户 ID
             * @example 1
             */
            id: number;
            /**
             * @description 租户编码
             * @example default
             */
            code: string;
            /**
             * @description 租户名称
             * @example Default Tenant
             */
            name: string;
            /**
             * @description 租户状态
             * @example ACTIVE
             * @enum {string}
             */
            status: "PENDING" | "ACTIVE" | "SUSPENDED" | "DISABLED" | "EXPIRED" | "ARCHIVED";
            /**
             * @description 联系人姓名
             * @example 张三
             */
            contactName: string | null;
            /**
             * @description 联系人电话
             * @example 13800138000
             */
            contactPhone: string | null;
            /**
             * @description 联系人邮箱
             * @example contact@example.com
             */
            contactEmail: string | null;
            /**
             * @description 套餐编码
             * @example standard
             */
            planCode: string;
            /**
             * @description 租户设置
             * @example {}
             */
            settings: Record<string, never> | null;
            /**
             * @description 备注
             * @example 测试租户
             */
            remark: string | null;
            /**
             * Format: date-time
             * @description 创建时间
             */
            createdAt: string;
            /**
             * Format: date-time
             * @description 更新时间
             */
            updatedAt: string;
            /**
             * @description 可用操作
             * @example [
             *       "SUSPEND",
             *       "DISABLE"
             *     ]
             */
            availableActions: string[];
            /** @description 统计信息 */
            _count: components["schemas"]["TenantCountResponseDto"];
        };
        UpdateTenantDto: Record<string, never>;
        TenantTransitionDto: Record<string, never>;
        TenantActionLogResponseDto: {
            /**
             * @description 日志 ID
             * @example 1
             */
            id: number;
            /**
             * @description 租户 ID
             * @example 1
             */
            tenantId: number;
            /**
             * @description 事件类型
             * @example APPROVE
             */
            event: string;
            /**
             * @description 变更前状态
             * @example PENDING
             */
            fromStatus: string;
            /**
             * @description 变更后状态
             * @example ACTIVE
             */
            toStatus: string;
            /**
             * @description 操作者 ID
             * @example 1
             */
            actorId: string;
            /**
             * @description 操作者名称
             * @example admin
             */
            actorName: string;
            /**
             * @description 操作者类型
             * @example PLATFORM_ADMIN
             */
            actorType: string;
            /**
             * @description 原因
             * @example 审核通过
             */
            reason: string | null;
            /**
             * @description 备注
             * @example 已核实
             */
            remark: string | null;
            /** @description 请求 ID */
            requestId: string | null;
            /**
             * Format: date-time
             * @description 创建时间
             */
            createdAt: string;
        };
        SmsSendResponseDto: {
            /**
             * @description 是否成功
             * @example true
             */
            success: boolean;
            /**
             * @description 调试验证码（仅 mock 模式下返回）
             * @example 123456
             */
            debugCode: string | null;
        };
        SendSmsDto: {
            /**
             * @description 手机号
             * @example 13800138001
             */
            phone: string;
            /**
             * @description 验证码场景
             * @enum {string}
             */
            scene: "login" | "register" | "reset_password";
        };
        CustomerProfileResponseDto: {
            /**
             * @description 用户ID
             * @example 1
             */
            id: number;
            /**
             * @description 用户ID（别名）
             * @example 1
             */
            user_id: number;
            /**
             * @description 手机号
             * @example 13800138000
             */
            phone: string;
            /**
             * @description 手机号（别名）
             * @example 13800138000
             */
            mobile: string;
            /**
             * @description 用户名
             * @example john_doe
             */
            username: string;
            /**
             * @description 昵称
             * @example 小明
             */
            nickname: string | null;
            /**
             * @description 头像
             * @example https://example.com/avatar.jpg
             */
            avatar: string;
            /**
             * @description 状态：1 启用 0 停用
             * @example 1
             */
            status: number;
        };
        CustomerTokenResponseDto: {
            /**
             * @description 访问令牌
             * @example eyJhbGciOiJIUzI1NiIs...
             */
            token: string;
            /**
             * @description 访问令牌（别名）
             * @example eyJhbGciOiJIUzI1NiIs...
             */
            accessToken: string;
            /**
             * @description 令牌有效期（秒）
             * @example 1800
             */
            expiresIn: number;
            /**
             * @description 刷新令牌
             * @example uuid.randomsecret
             */
            refreshToken: string;
            /**
             * @description 刷新令牌有效期（秒）
             * @example 2592000
             */
            refreshExpiresIn: number;
            /** @description 用户信息 */
            user: components["schemas"]["CustomerProfileResponseDto"];
        };
        CustomerRegisterDto: {
            /**
             * @description 手机号
             * @example 13800138001
             */
            phone: string;
            /**
             * @description 短信验证码
             * @example 123456
             */
            smsCode: string;
            /**
             * @description 密码
             * @example password123
             */
            password?: string;
        };
        CustomerPasswordLoginDto: {
            /**
             * @description 手机号
             * @example 13800138001
             */
            phone: string;
            /**
             * @description 密码
             * @example password123
             */
            password: string;
        };
        CustomerSmsLoginDto: {
            /**
             * @description 手机号
             * @example 13800138001
             */
            phone: string;
            /**
             * @description 短信验证码
             * @example 123456
             */
            smsCode: string;
        };
        CustomerRefreshTokenDto: {
            /** @description 刷新令牌 */
            refreshToken: string;
        };
        CustomerLogoutDto: {
            /** @description 刷新令牌 */
            refreshToken?: string;
        };
        PagePermissionResponseDto: {
            /**
             * @description 页面路径
             * @example /system/user
             */
            path: string;
            /**
             * @description 路由名称
             * @example UserList
             */
            name: string;
            /**
             * @description 页面标题
             * @example 用户管理
             */
            title: string;
            /**
             * @description 角色列表
             * @example [
             *       "admin"
             *     ]
             */
            roles: string[];
            /**
             * @description 权限码列表
             * @example [
             *       "user:view"
             *     ]
             */
            auths: string[];
        };
        ButtonPermissionResponseDto: {
            /**
             * @description 权限编码
             * @example user:view
             */
            code: string;
            /**
             * @description 权限名称
             * @example 用户查看
             */
            name: string;
            /**
             * @description 所属分组
             * @example 系统管理
             */
            group: string;
        };
        OnlineUserResponseDto: {
            /**
             * @description 用户 ID
             * @example 1
             */
            id: number;
            /**
             * @description 用户名
             * @example admin
             */
            username: string;
            /**
             * @description 角色
             * @example admin
             */
            role: string;
            /**
             * @description IP 地址
             * @example 127.0.0.1
             */
            ip: string | null;
            /**
             * @description 浏览器
             * @example Chrome
             */
            browser: string;
            /**
             * @description 操作系统
             * @example Windows
             */
            os: string;
            /**
             * Format: date-time
             * @description 登录时间
             */
            loginTime: string;
            /**
             * Format: date-time
             * @description 最后活跃时间
             */
            lastActiveAt: string;
        };
        SuccessResponseDto: {
            /**
             * @description 是否成功
             * @example true
             */
            success: boolean;
        };
        LoginLogResponseDto: {
            /**
             * @description 日志 ID
             * @example 1
             */
            id: number;
            /**
             * @description 用户 ID
             * @example 1
             */
            userId: number;
            /**
             * @description 用户名
             * @example admin
             */
            username: string;
            /** @description IP 地址 */
            ip: string | null;
            /** @description 地址 */
            address: string | null;
            /** @description 浏览器 */
            browser: string | null;
            /** @description 操作系统 */
            os: string | null;
            /**
             * @description 状态：1 成功 0 失败
             * @example 1
             */
            status: number;
            /** @description 登录结果消息，如登录成功、密码错误 */
            message: string | null;
            /**
             * Format: date-time
             * @description 创建时间
             */
            createdAt: string;
        };
        OperationLogResponseDto: {
            /**
             * @description 日志 ID
             * @example 1
             */
            id: number;
            /**
             * @description 用户名
             * @example admin
             */
            username: string;
            /**
             * @description 操作模块
             * @example 用户管理
             */
            module: string;
            /**
             * @description 操作动作
             * @example 新增用户
             */
            action: string;
            /**
             * @description 请求方法
             * @example POST
             */
            method: string;
            /**
             * @description 请求路径
             * @example /api/users
             */
            path: string;
            /** @description IP 地址 */
            ip: string | null;
            /**
             * @description 操作状态：1 成功 0 失败
             * @example 1
             */
            status: number;
            /**
             * @description 持续时间（毫秒）
             * @example 120
             */
            duration: number;
            /** @description 租户 ID */
            tenantId: number | null;
            /** @description 租户编码 */
            tenantCode: string | null;
            /**
             * Format: date-time
             * @description 创建时间
             */
            createdAt: string;
        };
        SystemLogResponseDto: {
            /**
             * @description 日志 ID
             * @example 1
             */
            id: number;
            /**
             * @description 日志级别
             * @example info
             */
            level: string;
            /**
             * @description 日志来源
             * @example NestJS
             */
            source: string;
            /**
             * @description 日志消息
             * @example 后台管理服务运行中
             */
            message: string;
            /** @description 详细内容 */
            detail: string | null;
            /**
             * Format: date-time
             * @description 创建时间
             */
            createdAt: Record<string, never>;
        };
        RoleResponseDto: {
            /**
             * @description 角色 ID
             * @example 1
             */
            id: number;
            /**
             * @description 角色名称
             * @example 管理员
             */
            name: string;
            /**
             * @description 角色编码
             * @example admin
             */
            code: string;
            /**
             * @description 状态：1 启用 0 停用
             * @example 1
             */
            status: number;
            /** @description 备注 */
            remark: string | null;
            /**
             * @description 权限码列表
             * @example [
             *       "*:*:*"
             *     ]
             */
            permissions: string[];
            /**
             * Format: date-time
             * @description 创建时间
             */
            createdAt: Record<string, never>;
        };
        UpsertRoleDto: {
            /** @description ID（更新时传入） */
            id?: number;
            /** @description 角色名称 */
            name?: string;
            /** @description 角色编码 */
            code?: string;
            /** @description 状态：1启用 0停用 */
            status?: number;
            /** @description 备注 */
            remark?: string;
            /** @description 权限码列表 */
            permissions?: string[];
        };
        MenuResponseDto: {
            /**
             * @description 菜单 ID
             * @example 1
             */
            id: number;
            /** @description 父菜单 ID */
            parentId: number | null;
            /**
             * @description 菜单标题
             * @example 用户管理
             */
            title: string;
            /**
             * @description 菜单路径
             * @example /system/user
             */
            path: string;
            /** @description 路由名称 */
            name: string | null;
            /** @description 图标 */
            icon: string | null;
            /** @description 权限标识 */
            permission: string | null;
            /**
             * @description 组件路径
             * @example system/user
             */
            component: string | null;
            /**
             * @description 菜单类型
             * @example menu
             * @enum {string}
             */
            type: "catalog" | "menu" | "button";
            /**
             * @description 排序号
             * @example 1
             */
            sort: number;
            /**
             * @description 状态：1 启用 0 停用
             * @example 1
             */
            status: number;
            /** @description 子菜单列表 */
            children?: components["schemas"]["MenuResponseDto"][];
        };
        UpsertMenuDto: {
            /** @description ID（更新时传入） */
            id?: number;
            /** @description 父级菜单 ID */
            parentId?: Record<string, never>;
            /** @description 菜单名称 */
            title?: string;
            /** @description 路由路径 */
            path?: string;
            /** @description 路由名称 */
            name?: string;
            /** @description 图标 */
            icon?: string;
            /** @description 权限标识 */
            permission?: string;
            /** @description 组件路径 */
            component?: string;
            /** @description 菜单类型 */
            type?: string;
            /** @description 排序 */
            sort?: number;
            /** @description 状态：1启用 0停用 */
            status?: number;
        };
        DeptResponseDto: {
            /**
             * @description 部门 ID
             * @example 1
             */
            id: number;
            /** @description 父部门 ID */
            parentId: number | null;
            /**
             * @description 部门名称
             * @example 技术部
             */
            name: string;
            /** @description 负责人 */
            leader: string | null;
            /** @description 电话 */
            phone: string | null;
            /** @description 邮箱 */
            email: string | null;
            /**
             * @description 排序号
             * @example 1
             */
            sort: number;
            /**
             * @description 状态：1 启用 0 停用
             * @example 1
             */
            status: number;
            /** @description 子部门列表 */
            children?: components["schemas"]["DeptResponseDto"][];
        };
        UpsertDeptDto: {
            /** @description ID（更新时传入） */
            id?: number;
            /** @description 父级部门 ID */
            parentId?: Record<string, never>;
            /** @description 部门名称 */
            name?: string;
            /** @description 负责人 */
            leader?: string;
            /** @description 电话 */
            phone?: string;
            /** @description 邮箱 */
            email?: string;
            /** @description 排序 */
            sort?: number;
            /** @description 状态：1启用 0停用 */
            status?: number;
        };
        AdminOrderActionLogDto: {
            /** @example 1 */
            id: number;
            /** @example ELMDEMO202606020001 */
            orderNo: string;
            /** @example 1 */
            operatorId: string;
            /** @example admin */
            operatorName: string;
            /**
             * @example ADMIN
             * @enum {string}
             */
            operatorType: "ADMIN" | "CUSTOMER" | "SYSTEM";
            /** @example ACCEPT */
            action: string;
            /** @enum {string|null} */
            fromFulfillmentStatus: "PENDING_PAYMENT" | "AWAITING_ACCEPTANCE" | "ACCEPTED" | "PREPARING" | "DELIVERING" | "COMPLETED" | "CANCELED" | null;
            /** @enum {string|null} */
            toFulfillmentStatus: "PENDING_PAYMENT" | "AWAITING_ACCEPTANCE" | "ACCEPTED" | "PREPARING" | "DELIVERING" | "COMPLETED" | "CANCELED" | null;
            /** @enum {string|null} */
            fromRefundStatus: "NONE" | "REQUESTED" | "APPROVED" | "REJECTED" | null;
            /** @enum {string|null} */
            toRefundStatus: "NONE" | "REQUESTED" | "APPROVED" | "REJECTED" | null;
            reason: string | null;
            remark: string | null;
            /** @example req-admin-1 */
            requestId: string | null;
            /**
             * Format: date-time
             * @example 2026-06-02T10:00:00.000Z
             */
            createdAt: string;
        };
        AdminOrderDetailDto: {
            /** @example 1 */
            id: number;
            /** @example ELMDEMO202606020001 */
            orderNo: string;
            /** @example 42 */
            userId: string;
            /** @example 1 */
            shopId: string | null;
            /** @example Demo Shop */
            shopName: string;
            /**
             * @example PAID
             * @enum {string}
             */
            status: "PENDING" | "PAID" | "CLOSED";
            /** @example TRADE_SUCCESS */
            tradeStatus: string;
            /**
             * @example AWAITING_ACCEPTANCE
             * @enum {string}
             */
            fulfillmentStatus: "PENDING_PAYMENT" | "AWAITING_ACCEPTANCE" | "ACCEPTED" | "PREPARING" | "DELIVERING" | "COMPLETED" | "CANCELED";
            /**
             * @example NONE
             * @enum {string}
             */
            refundStatus: "NONE" | "REQUESTED" | "APPROVED" | "REJECTED";
            /** @enum {string|null} */
            refundBaseFulfillmentStatus: "PENDING_PAYMENT" | "AWAITING_ACCEPTANCE" | "ACCEPTED" | "PREPARING" | "DELIVERING" | "COMPLETED" | "CANCELED" | null;
            refundReason: string | null;
            refundRejectReason: string | null;
            tradeNo: string | null;
            /** @example 29 */
            payableAmount: number;
            /** @example 24 */
            goodsAmount: number;
            /** @example 5 */
            deliveryFee: number;
            cartItems: {
                [key: string]: unknown;
            }[];
            /** @example 2 */
            totalQty: number;
            paidAt: string | null;
            acceptedAt: string | null;
            preparingAt: string | null;
            deliveringAt: string | null;
            completedAt: string | null;
            canceledAt: string | null;
            refundRequestedAt: string | null;
            refundedAt: string | null;
            refundRejectedAt: string | null;
            /**
             * Format: date-time
             * @example 2026-06-02T09:55:00.000Z
             */
            createdAt: string;
            /**
             * Format: date-time
             * @example 2026-06-02T10:00:00.000Z
             */
            updatedAt: string;
            availableActions: ("ACCEPT" | "START_PREPARING" | "START_DELIVERY" | "COMPLETE" | "APPROVE_REFUND" | "REJECT_REFUND")[];
            customerAvailableActions: "REQUEST_REFUND"[];
            actionLogs: components["schemas"]["AdminOrderActionLogDto"][];
        };
        AdminOrderDetailHttpResponseDto: {
            /** @example 200 */
            code: number;
            /** @example success */
            message: string;
            data: components["schemas"]["AdminOrderDetailDto"];
            /** @example 2026-06-08T00:00:00.000Z */
            timestamp: string;
        };
        ApproveRefundDto: Record<string, never>;
        RejectRefundDto: Record<string, never>;
        AlipayWapPaymentResponseDto: {
            /**
             * @description 支付订单号
             * @example ELMALI202605241200000001
             */
            orderNo: string;
            /**
             * @description 唤起支付宝的支付链接
             * @example https://openapi.alipaydev.com/gateway.do
             */
            payUrl: string;
            /**
             * @description 应付金额
             * @example 39.8
             */
            payableAmount: number;
        };
        CreateAlipayWapPaymentDto: Record<string, never>;
        ResumeAlipayWapPaymentDto: {
            /**
             * @description Payment order number to resume.
             * @example ELMALI202605241200000001
             */
            orderNo: string;
        };
        PaymentCartItemResponseDto: {
            /**
             * @description 商品项 ID
             * @example item-001
             */
            itemId: string;
            /**
             * @description SKU ID
             * @example sku-001
             */
            skuId: string;
            /**
             * @description 商品标题
             * @example 香辣鸡腿堡
             */
            title: string;
            /**
             * @description 数量
             * @example 2
             */
            qty: number;
            /**
             * @description 单价
             * @example 19.9
             */
            unitPrice: number;
            /**
             * @description 小计金额
             * @example 39.8
             */
            totalPrice: number;
        };
        PaymentOrderSummaryResponseDto: {
            /**
             * @description 订单 ID
             * @example 1
             */
            id: number;
            /**
             * @description 订单号
             * @example ELMALI202605241200000001
             */
            orderNo: string;
            /**
             * @description 用户 ID
             * @example 1
             */
            userId: string;
            /**
             * @description 店铺 ID
             * @example shop-001
             */
            shopId: string | null;
            /**
             * @description 店铺名称
             * @example 麦当劳
             */
            shopName: string;
            /**
             * @description 订单状态：PENDING 待支付, PAID 已支付, CLOSED 已关闭
             * @example PENDING
             */
            status: string;
            /**
             * @description 支付宝交易状态
             * @example WAIT_BUYER_PAY
             */
            tradeStatus: string;
            /**
             * @description 履约状态
             * @example PENDING_PAYMENT
             */
            fulfillmentStatus: string;
            /**
             * @description 退款状态
             * @example NONE
             */
            refundStatus: string;
            /** @description 退款基准履约状态 */
            refundBaseFulfillmentStatus: string | null;
            /** @description 退款原因 */
            refundReason: string | null;
            /** @description 退款驳回原因 */
            refundRejectReason: string | null;
            /**
             * @description 应付金额
             * @example 39.8
             */
            payableAmount: number;
            /**
             * @description 商品金额
             * @example 39.8
             */
            goodsAmount: number;
            /**
             * @description 配送费
             * @example 0
             */
            deliveryFee: number;
            /** @description 购物车商品列表 */
            cartItems: components["schemas"]["PaymentCartItemResponseDto"][];
            /**
             * @description 总数量
             * @example 2
             */
            totalQty: number;
            /**
             * Format: date-time
             * @description 支付时间
             */
            paidAt: Record<string, never> | null;
            /**
             * Format: date-time
             * @description 接单时间
             */
            acceptedAt: Record<string, never> | null;
            /**
             * Format: date-time
             * @description 备餐时间
             */
            preparingAt: Record<string, never> | null;
            /**
             * Format: date-time
             * @description 配送时间
             */
            deliveringAt: Record<string, never> | null;
            /**
             * Format: date-time
             * @description 完成时间
             */
            completedAt: Record<string, never> | null;
            /**
             * Format: date-time
             * @description 取消时间
             */
            canceledAt: Record<string, never> | null;
            /**
             * Format: date-time
             * @description 退款申请时间
             */
            refundRequestedAt: Record<string, never> | null;
            /**
             * Format: date-time
             * @description 退款时间
             */
            refundedAt: Record<string, never> | null;
            /**
             * Format: date-time
             * @description 退款驳回时间
             */
            refundRejectedAt: Record<string, never> | null;
            /**
             * Format: date-time
             * @description 创建时间
             */
            createdAt: string;
            /**
             * Format: date-time
             * @description 更新时间
             */
            updatedAt: string;
            /** @description 支付宝交易号 */
            tradeNo: string | null;
            /** @description 管理员可用操作 */
            availableActions: string[];
            /** @description 用户可用操作 */
            customerAvailableActions: string[];
        };
        RequestRefundDto: Record<string, never>;
        PaymentOrdersResponseDto: {
            /** @description 订单列表 */
            orders: components["schemas"]["PaymentOrderSummaryResponseDto"][];
        };
        MerchantMaterialResponseDto: {
            /**
             * @description 材料 ID
             * @example mat-001
             */
            id: string;
            /**
             * @description 材料名称
             * @example 营业执照
             */
            name: string;
            /**
             * @description 材料类型
             * @example image
             * @enum {string}
             */
            type: "image" | "pdf" | "file";
            /**
             * @description 材料链接
             * @example https://example.com/license.jpg
             */
            url: string;
        };
        MerchantApplicationResponseDto: {
            /**
             * @description 申请 ID
             * @example app-001
             */
            id: string;
            /**
             * @description 商户名称
             * @example 麦当劳
             */
            merchantName: string;
            /**
             * @description 联系人姓名
             * @example 张三
             */
            contactName: string | null;
            /**
             * @description 联系人电话
             * @example 13800138000
             */
            contactPhone: string | null;
            /**
             * @description 经营品类
             * @example 餐饮
             */
            businessCategory: string | null;
            /**
             * @description 地址
             * @example 北京市朝阳区
             */
            address: string | null;
            /**
             * @description 申请状态
             * @example PENDING
             * @enum {string}
             */
            status: "PENDING" | "UNDER_REVIEW" | "SUPPLEMENT_REQUESTED" | "APPROVED" | "REJECTED" | "CANCELED";
            /**
             * @description 可用操作
             * @example [
             *       "START_REVIEW"
             *     ]
             */
            availableActions: string[];
            /** @description 申请材料列表 */
            materials: components["schemas"]["MerchantMaterialResponseDto"][];
            /**
             * Format: date-time
             * @description 创建时间
             */
            createdAt: string;
            /**
             * Format: date-time
             * @description 更新时间
             */
            updatedAt: string;
        };
        ReviewMerchantApplicationDto: Record<string, never>;
        MerchantApplicationActionLogResponseDto: {
            /**
             * @description 日志 ID
             * @example log-001
             */
            id: string;
            /**
             * @description 事件类型
             * @example APPROVE
             * @enum {string}
             */
            event: "START_REVIEW" | "APPROVE" | "REJECT" | "REQUEST_SUPPLEMENT";
            /**
             * @description 变更前状态
             * @example UNDER_REVIEW
             */
            fromStatus: string;
            /**
             * @description 变更后状态
             * @example APPROVED
             */
            toStatus: string;
            /**
             * @description 操作者名称
             * @example admin
             */
            actorName: string;
            /**
             * @description 原因
             * @example 资料齐全
             */
            reason: string | null;
            /**
             * @description 备注
             * @example 已核实
             */
            remark: string | null;
            /**
             * Format: date-time
             * @description 创建时间
             */
            createdAt: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    HealthController_check: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["HealthResponseDto"];
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    UserController_findAll: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["UserResponseDto"][];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    UserController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateUserDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["UserResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 资源状态冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 409 */
                        code?: unknown;
                        /** @example 资源状态冲突 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    UserController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 用户 ID */
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["UserResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    UserController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 用户 ID */
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"];
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    UserController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 用户 ID */
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateUserDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["UserResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 资源状态冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 409 */
                        code?: unknown;
                        /** @example 资源状态冲突 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AuthController_login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["LoginResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AuthController_getProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["AdminProfileResponseDto"];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AuthController_updateProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProfileDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["AdminUpdatedProfileResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 资源状态冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 409 */
                        code?: unknown;
                        /** @example 资源状态冲突 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AuthController_getMenus: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["AdminMenuResponseDto"][];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AuthController_logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"];
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AuthController_getSecurityLogs: {
        parameters: {
            query?: {
                page?: number;
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["SecurityLogsResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    NotificationController_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["NotificationItemResponseDto"][];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    NotificationController_clear: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["DeletedCountResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    NotificationController_markAllRead: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MarkAllReadDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["UpdatedCountResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    NotificationController_markRead: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["NotificationItemResponseDto"];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    NotificationController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["NotificationSuccessResponseDto"];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    TenantController_listTenants: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["TenantResponseDto"][];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    TenantController_createTenant: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateTenantDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["TenantResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    TenantController_getTenantDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["TenantDetailResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    TenantController_updateTenant: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateTenantDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["TenantResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    TenantController_transitionTenant: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TenantTransitionDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["TenantResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 资源状态冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 409 */
                        code?: unknown;
                        /** @example 资源状态冲突 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    TenantController_getTenantActionLogs: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["TenantActionLogResponseDto"][];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    CustomerAuthController_sendSms: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SendSmsDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["SmsSendResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求过于频繁 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 429 */
                        code?: unknown;
                        /** @example 请求过于频繁 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    CustomerAuthController_register: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CustomerRegisterDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["CustomerTokenResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 资源状态冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 409 */
                        code?: unknown;
                        /** @example 资源状态冲突 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    CustomerAuthController_loginByPassword: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CustomerPasswordLoginDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["CustomerTokenResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    CustomerAuthController_loginBySms: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CustomerSmsLoginDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["CustomerTokenResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    CustomerAuthController_refresh: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CustomerRefreshTokenDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["CustomerTokenResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    CustomerAuthController_logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CustomerLogoutDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"];
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    CustomerAuthController_getProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["CustomerProfileResponseDto"];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_getPagePermissions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["PagePermissionResponseDto"][];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_getButtonPermissions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["ButtonPermissionResponseDto"][];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_getOnlineUsers: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["OnlineUserResponseDto"][];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_forceLogout: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["SuccessResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_getLoginLogs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["LoginLogResponseDto"][];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_getOperationLogs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["OperationLogResponseDto"][];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_getSystemLogs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["SystemLogResponseDto"][];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_getRoles: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["RoleResponseDto"][];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_createRole: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpsertRoleDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["RoleResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_deleteRole: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["SuccessResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_updateRole: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpsertRoleDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["RoleResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_getMenus: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["MenuResponseDto"][];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_createMenu: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpsertMenuDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["MenuResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_deleteMenu: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["SuccessResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_updateMenu: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpsertMenuDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["MenuResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_getDepts: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["DeptResponseDto"][];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_createDept: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpsertDeptDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["DeptResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_deleteDept: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["SuccessResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    AdminController_updateDept: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpsertDeptDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["DeptResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    ElmLocationController_getCities: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmLocationController_getCity: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmLocationController_searchPois: {
        parameters: {
            query: {
                city_id: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmLocationController_getPoiByQuery: {
        parameters: {
            query: {
                geohash: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmLocationController_getPoiByParam: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                geohash: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmLocationController_reverseGeoCoding: {
        parameters: {
            query: {
                latitude: string;
                longitude: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmLocationController_getIndexEntry: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmRestaurantPublicController_getRestaurants: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmRestaurantPublicController_getRestaurantCount: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmRestaurantPublicController_searchRestaurants: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmRestaurantPublicController_getRestaurantCategories: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmRestaurantPublicController_getDeliveryModes: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmRestaurantPublicController_getActivityAttributes: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmRestaurantPublicController_getRestaurant: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                shopId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmRestaurantPublicController_addRestaurant: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmRestaurantPublicController_updateRestaurant: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmRestaurantPublicController_deleteRestaurant: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurantId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmFoodPublicController_getMenu: {
        parameters: {
            query: {
                restaurant_id: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmFoodPublicController_getFoodCategories: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurantId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmFoodPublicController_getFoodCategoryDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                categoryId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmFoodPublicController_getFoods: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmFoodPublicController_getFoodCount: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmFoodPublicController_addFood: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmFoodPublicController_updateFood: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmFoodPublicController_deleteFood: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                foodId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmFoodPublicController_getRatingTags: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurantId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmFoodPublicController_getRatings: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurantId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmUserPublicController_getCaptchas: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmUserPublicController_login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmUserPublicController_mobileLogin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmUserPublicController_getUser: {
        parameters: {
            query: {
                user_id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmUserPublicController_changePassword: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmUserPublicController_signout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmUserPublicController_getAddresses: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                userId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmUserPublicController_addAddress: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                userId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmUserPublicController_deleteAddress: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                userId: number;
                addressId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmUserPublicController_uploadAvatar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                userId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmOrderPublicController_getOrders: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmOrderPublicController_getOrderCount: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmAdminController_getRestaurants: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmAdminController_createRestaurant: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmAdminController_deleteRestaurant: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmAdminController_updateRestaurant: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmAdminController_getFoods: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmAdminController_createFood: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmAdminController_deleteFood: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmAdminController_updateFood: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmAdminController_getOrders: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmAdminController_getOrderDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderNo: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Admin order detail response envelope */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminOrderDetailHttpResponseDto"];
                };
            };
        };
    };
    ElmAdminController_acceptOrder: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderNo: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmAdminController_startPreparing: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderNo: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmAdminController_startDelivery: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderNo: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmAdminController_completeOrder: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderNo: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmAdminController_approveRefund: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderNo: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ApproveRefundDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ElmAdminController_rejectRefund: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderNo: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RejectRefundDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PaymentController_createAlipayWapPayment: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateAlipayWapPaymentDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AlipayWapPaymentResponseDto"];
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    PaymentController_resumeAlipayWapPayment: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResumeAlipayWapPaymentDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AlipayWapPaymentResponseDto"];
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    PaymentController_getAlipayPaymentStatus: {
        parameters: {
            query: {
                refresh: string;
            };
            header?: never;
            path: {
                orderNo: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaymentOrderSummaryResponseDto"];
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    PaymentController_requestRefund: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderNo: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RequestRefundDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaymentOrderSummaryResponseDto"];
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 资源状态冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 409 */
                        code?: unknown;
                        /** @example 资源状态冲突 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    PaymentController_handleAlipayNotify: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 处理结果 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": "success" | "failure";
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    PaymentController_listOrders: {
        parameters: {
            query: {
                limit: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaymentOrdersResponseDto"];
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    MerchantOnboardingController_listApplications: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["MerchantApplicationResponseDto"][];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    MerchantOnboardingController_getApplicationDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["MerchantApplicationResponseDto"];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    MerchantOnboardingController_reviewApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReviewMerchantApplicationDto"];
            };
        };
        responses: {
            /** @description 请求成功 */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["MerchantApplicationResponseDto"];
                    };
                };
            };
            /** @description 请求参数错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 400 */
                        code?: unknown;
                        /** @example 请求参数错误 */
                        message?: unknown;
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 资源状态冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 409 */
                        code?: unknown;
                        /** @example 资源状态冲突 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
    MerchantOnboardingController_getApplicationActionLogs: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 请求成功 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponseEnvelopeDto"] & {
                        data: components["schemas"]["MerchantApplicationActionLogResponseDto"][];
                    };
                };
            };
            /** @description 未认证或认证已失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 401 */
                        code?: unknown;
                        /** @example 未认证或认证已失效 */
                        message?: unknown;
                    };
                };
            };
            /** @description 无权访问该资源 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 403 */
                        code?: unknown;
                        /** @example 无权访问该资源 */
                        message?: unknown;
                    };
                };
            };
            /** @description 请求的资源不存在 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 404 */
                        code?: unknown;
                        /** @example 请求的资源不存在 */
                        message?: unknown;
                    };
                };
            };
            /** @description 服务器内部错误 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponseDto"] & {
                        /** @example 500 */
                        code?: unknown;
                        /** @example 服务器内部错误 */
                        message?: unknown;
                    };
                };
            };
        };
    };
}
