import { Type } from '@nestjs/common'
import { PATH_METADATA } from '@nestjs/common/constants'
import { HealthController } from '../../health/health.controller'
import { AdminController } from '../../modules/admin/admin.controller'
import { AuthController } from '../../modules/auth/auth.controller'
import { CustomerAuthController } from '../../modules/customer-auth/customer-auth.controller'
import { MerchantOnboardingController } from '../../modules/merchant-onboarding/merchant-onboarding.controller'
import { NotificationController } from '../../modules/notification/notification.controller'
import { PaymentController } from '../../modules/payment/payment.controller'
import { TenantController } from '../../modules/tenant/tenant.controller'
import { UserController } from '../../modules/user/user.controller'

const API_RESPONSE_METADATA = 'swagger/apiResponse'

interface ControllerEntry {
  controller: Type<unknown>
  method: string
  success: number
  errors: number[]
}

function getResponses(controller: Type<unknown>, method: string): Record<string, any> {
  const classResponses = (Reflect.getMetadata(API_RESPONSE_METADATA, controller) ?? {}) as Record<string, any>
  const handler = controller.prototype[method]
  const methodResponses = (Reflect.getMetadata(API_RESPONSE_METADATA, handler) ?? {}) as Record<string, any>
  return {
    ...classResponses,
    ...methodResponses,
  }
}

function getRouteMethods(controller: Type<unknown>): string[] {
  const prototype = controller.prototype
  return Object.getOwnPropertyNames(prototype)
    .filter((name) => {
      if (name === 'constructor')
        return false
      const descriptor = Object.getOwnPropertyDescriptor(prototype, name)
      return descriptor && typeof descriptor.value === 'function'
    })
    .filter((name) => {
      const handler = prototype[name]
      const pathMeta = Reflect.getMetadata(PATH_METADATA, handler)
      return pathMeta !== undefined
    })
}

const controllerEntries: ControllerEntry[] = [
  {
    controller: HealthController,
    method: 'check',
    success: 200,
    errors: [500],
  },
  {
    controller: AuthController,
    method: 'login',
    success: 200,
    errors: [400, 401, 500],
  },
  {
    controller: AuthController,
    method: 'getProfile',
    success: 200,
    errors: [401, 500],
  },
  {
    controller: AuthController,
    method: 'getMenus',
    success: 200,
    errors: [401, 500],
  },
  {
    controller: AuthController,
    method: 'updateProfile',
    success: 200,
    errors: [400, 401, 409, 500],
  },
  {
    controller: AuthController,
    method: 'logout',
    success: 200,
    errors: [401, 500],
  },
  {
    controller: AuthController,
    method: 'getSecurityLogs',
    success: 200,
    errors: [400, 401, 500],
  },
  {
    controller: CustomerAuthController,
    method: 'sendSms',
    success: 201,
    errors: [400, 429, 500],
  },
  {
    controller: CustomerAuthController,
    method: 'register',
    success: 201,
    errors: [400, 409, 500],
  },
  {
    controller: CustomerAuthController,
    method: 'loginByPassword',
    success: 201,
    errors: [400, 401, 500],
  },
  {
    controller: CustomerAuthController,
    method: 'loginBySms',
    success: 201,
    errors: [400, 401, 500],
  },
  {
    controller: CustomerAuthController,
    method: 'refresh',
    success: 201,
    errors: [400, 401, 500],
  },
  {
    controller: CustomerAuthController,
    method: 'logout',
    success: 200,
    errors: [400, 500],
  },
  {
    controller: CustomerAuthController,
    method: 'getProfile',
    success: 200,
    errors: [401, 500],
  },
  {
    controller: AdminController,
    method: 'getPagePermissions',
    success: 200,
    errors: [401, 403, 500],
  },
  {
    controller: AdminController,
    method: 'getButtonPermissions',
    success: 200,
    errors: [401, 403, 500],
  },
  {
    controller: AdminController,
    method: 'getOnlineUsers',
    success: 200,
    errors: [401, 403, 500],
  },
  {
    controller: AdminController,
    method: 'forceLogout',
    success: 201,
    errors: [400, 401, 403, 500],
  },
  {
    controller: AdminController,
    method: 'getLoginLogs',
    success: 200,
    errors: [401, 403, 500],
  },
  {
    controller: AdminController,
    method: 'getOperationLogs',
    success: 200,
    errors: [401, 403, 500],
  },
  {
    controller: AdminController,
    method: 'getSystemLogs',
    success: 200,
    errors: [401, 403, 500],
  },
  {
    controller: AdminController,
    method: 'getRoles',
    success: 200,
    errors: [401, 403, 500],
  },
  {
    controller: AdminController,
    method: 'createRole',
    success: 201,
    errors: [400, 401, 403, 500],
  },
  {
    controller: AdminController,
    method: 'updateRole',
    success: 200,
    errors: [400, 401, 403, 404, 500],
  },
  {
    controller: AdminController,
    method: 'deleteRole',
    success: 200,
    errors: [400, 401, 403, 500],
  },
  {
    controller: AdminController,
    method: 'getMenus',
    success: 200,
    errors: [401, 403, 500],
  },
  {
    controller: AdminController,
    method: 'createMenu',
    success: 201,
    errors: [400, 401, 403, 500],
  },
  {
    controller: AdminController,
    method: 'updateMenu',
    success: 200,
    errors: [400, 401, 403, 404, 500],
  },
  {
    controller: AdminController,
    method: 'deleteMenu',
    success: 200,
    errors: [400, 401, 403, 500],
  },
  {
    controller: AdminController,
    method: 'getDepts',
    success: 200,
    errors: [401, 403, 500],
  },
  {
    controller: AdminController,
    method: 'createDept',
    success: 201,
    errors: [400, 401, 403, 500],
  },
  {
    controller: AdminController,
    method: 'updateDept',
    success: 200,
    errors: [400, 401, 403, 404, 500],
  },
  {
    controller: AdminController,
    method: 'deleteDept',
    success: 200,
    errors: [400, 401, 403, 500],
  },
  {
    controller: UserController,
    method: 'create',
    success: 201,
    errors: [400, 401, 403, 409, 500],
  },
  {
    controller: UserController,
    method: 'findAll',
    success: 200,
    errors: [401, 403, 500],
  },
  {
    controller: UserController,
    method: 'findOne',
    success: 200,
    errors: [400, 401, 403, 404, 500],
  },
  {
    controller: UserController,
    method: 'update',
    success: 200,
    errors: [400, 401, 403, 404, 409, 500],
  },
  {
    controller: UserController,
    method: 'remove',
    success: 200,
    errors: [400, 401, 403, 404, 500],
  },
  {
    controller: TenantController,
    method: 'listTenants',
    success: 200,
    errors: [401, 403, 500],
  },
  {
    controller: TenantController,
    method: 'createTenant',
    success: 201,
    errors: [400, 401, 403, 500],
  },
  {
    controller: TenantController,
    method: 'getTenantDetail',
    success: 200,
    errors: [400, 401, 403, 404, 500],
  },
  {
    controller: TenantController,
    method: 'updateTenant',
    success: 200,
    errors: [400, 401, 403, 404, 500],
  },
  {
    controller: TenantController,
    method: 'transitionTenant',
    success: 201,
    errors: [400, 401, 403, 404, 409, 500],
  },
  {
    controller: TenantController,
    method: 'getTenantActionLogs',
    success: 200,
    errors: [400, 401, 403, 404, 500],
  },
  {
    controller: MerchantOnboardingController,
    method: 'listApplications',
    success: 200,
    errors: [400, 401, 403, 500],
  },
  {
    controller: MerchantOnboardingController,
    method: 'getApplicationDetail',
    success: 200,
    errors: [401, 403, 404, 500],
  },
  {
    controller: MerchantOnboardingController,
    method: 'reviewApplication',
    success: 201,
    errors: [400, 401, 403, 404, 409, 500],
  },
  {
    controller: MerchantOnboardingController,
    method: 'getApplicationActionLogs',
    success: 200,
    errors: [401, 403, 404, 500],
  },
  {
    controller: NotificationController,
    method: 'list',
    success: 200,
    errors: [400, 401, 500],
  },
  {
    controller: NotificationController,
    method: 'markAllRead',
    success: 200,
    errors: [400, 401, 500],
  },
  {
    controller: NotificationController,
    method: 'markRead',
    success: 200,
    errors: [401, 404, 500],
  },
  {
    controller: NotificationController,
    method: 'remove',
    success: 200,
    errors: [401, 404, 500],
  },
  {
    controller: NotificationController,
    method: 'clear',
    success: 200,
    errors: [400, 401, 500],
  },
  {
    controller: PaymentController,
    method: 'createAlipayWapPayment',
    success: 201,
    errors: [400, 401, 500],
  },
  {
    controller: PaymentController,
    method: 'resumeAlipayWapPayment',
    success: 200,
    errors: [400, 401, 404, 500],
  },
  {
    controller: PaymentController,
    method: 'getAlipayPaymentStatus',
    success: 200,
    errors: [401, 404, 500],
  },
  {
    controller: PaymentController,
    method: 'requestRefund',
    success: 201,
    errors: [400, 401, 404, 409, 500],
  },
  {
    controller: PaymentController,
    method: 'handleAlipayNotify',
    success: 201,
    errors: [500],
  },
  {
    controller: PaymentController,
    method: 'listOrders',
    success: 200,
    errors: [401, 500],
  },
]

describe('swagger response coverage', () => {
  it('does not import any elm controller', () => {
    expect(controllerEntries.some(entry =>
      String(entry.controller).includes('Elm'),
    )).toBe(false)
  })

  it('has every non-elm controller method documented in the matrix', () => {
    const controllers = [
      HealthController,
      AuthController,
      CustomerAuthController,
      AdminController,
      UserController,
      TenantController,
      MerchantOnboardingController,
      NotificationController,
      PaymentController,
    ]

    for (const controller of controllers) {
      const routeMethods = getRouteMethods(controller)
      const matrixMethods = controllerEntries
        .filter(e => e.controller === controller)
        .map(e => e.method)

      expect(routeMethods.sort()).toEqual(matrixMethods.sort())
    }
  })

  describe.each(controllerEntries)(
    '$controller.name.$method',
    (entry) => {
      it(`has a ${entry.success} success response with a schema`, () => {
        const responses = getResponses(entry.controller, entry.method)
        const successResponse = responses[String(entry.success)]

        expect(successResponse).toBeDefined()
        // Success responses may have content (envelope/raw) or schema (string enum)
        const hasSchema = successResponse?.content?.['application/json']?.schema
          || successResponse?.schema
        expect(hasSchema).toBeDefined()
      })

      it.each(entry.errors.map(String))(`has a %s error response`, (status) => {
        const responses = getResponses(entry.controller, entry.method)
        const errorResponse = responses[status]

        expect(errorResponse).toBeDefined()
        const hasSchema = errorResponse?.schema
          || errorResponse?.content?.['application/json']?.schema
        expect(hasSchema).toBeDefined()
      })
    },
  )
})
