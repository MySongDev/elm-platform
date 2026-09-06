import type { MerchantOnboardingService } from './merchant-onboarding.service'
import { PERMISSIONS_KEY } from '../auth/decorators/permissions.decorator'
import { MerchantOnboardingController } from './merchant-onboarding.controller'
import 'reflect-metadata'

function createController() {
  const service = {
    listApplications: jest.fn().mockResolvedValue([]),
    getApplicationDetail: jest.fn().mockResolvedValue({ id: 'app_1' }),
    reviewApplication: jest.fn().mockResolvedValue({
      id: 'app_1',
      status: 'UNDER_REVIEW',
    }),
    getApplicationActionLogs: jest.fn().mockResolvedValue([]),
  }
  const controller = new MerchantOnboardingController(service as unknown as MerchantOnboardingService)
  const request = {
    user: {
      id: 1,
      username: 'admin',
    },
  }

  return {
    controller,
    service,
    request,
  }
}

describe('merchantOnboardingController', () => {
  it('uses admin permission metadata for route handlers', () => {
    expect(Reflect.getMetadata(PERMISSIONS_KEY, MerchantOnboardingController.prototype.listApplications)).toEqual([
      'merchant:onboarding:view',
    ])
    expect(Reflect.getMetadata(PERMISSIONS_KEY, MerchantOnboardingController.prototype.getApplicationDetail)).toEqual([
      'merchant:onboarding:view',
    ])
    expect(Reflect.getMetadata(PERMISSIONS_KEY, MerchantOnboardingController.prototype.reviewApplication)).toEqual([
      'merchant:onboarding:review',
    ])
    expect(Reflect.getMetadata(PERMISSIONS_KEY, MerchantOnboardingController.prototype.getApplicationActionLogs)).toEqual([
      'merchant:onboarding:view',
    ])
  })

  it('delegates list, detail, review, and action log calls to the service', async () => {
    const { controller, service, request } = createController()

    await controller.listApplications({ status: 'PENDING' })
    await controller.getApplicationDetail('app_1')
    await controller.reviewApplication('app_1', { action: 'START_REVIEW' }, request)
    await controller.getApplicationActionLogs('app_1')

    expect(service.listApplications).toHaveBeenCalledWith({ status: 'PENDING' })
    expect(service.getApplicationDetail).toHaveBeenCalledWith('app_1')
    expect(service.reviewApplication).toHaveBeenCalledWith('app_1', { action: 'START_REVIEW' }, {
      id: 1,
      name: 'admin',
      type: 'PLATFORM_ADMIN',
    })
    expect(service.getApplicationActionLogs).toHaveBeenCalledWith('app_1')
  })
})
