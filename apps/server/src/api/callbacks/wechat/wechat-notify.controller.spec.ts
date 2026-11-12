import { Test } from '@nestjs/testing'
import request from 'supertest'
import { TransformInterceptor } from '../../../common/interceptors/transform.interceptor'
import { WechatPaymentService } from '../../../modules/payment/wechat/wechat-payment.service'
import { WechatNotifyController } from './wechat-notify.controller'

/**
 * 用真实 Controller + 响应拦截器验 HTTP 状态：只断言响应体会把「200 + FAIL」误当成功，
 * 而微信按状态码决定是否重推。
 */
async function createApp(handleNotification: jest.Mock) {
  const moduleRef = await Test.createTestingModule({
    controllers: [WechatNotifyController],
    providers: [{
      provide: WechatPaymentService,
      useValue: { handleNotification },
    }],
  }).compile()
  const app = moduleRef.createNestApplication({
    rawBody: true,
    logger: false,
  })
  app.useGlobalInterceptors(new TransformInterceptor())
  await app.init()
  return app
}

describe('wechatNotifyController HTTP 应答', () => {
  it.each([true, false])('处理结果 %s 决定 HTTP 状态，响应体保持微信裸结构', async (ok) => {
    const handleNotification = jest.fn().mockResolvedValue(ok)
    const app = await createApp(handleNotification)

    try {
      const response = await request(app.getHttpServer())
        .post('/payments/wechat/notify')
        .send({ event_type: 'TRANSACTION.SUCCESS' })

      expect(response.status).toBe(ok ? 200 : 500)
      expect(response.body).toEqual(ok
        ? {
            code: 'SUCCESS',
            message: '成功',
          }
        : {
            code: 'FAIL',
            message: '处理失败',
          })
      expect(handleNotification).toHaveBeenCalledTimes(1)
    }
    finally {
      await app.close()
    }
  })

  it('业务层意外抛错时仍回 500，不暴露内部错误', async () => {
    const app = await createApp(jest.fn().mockRejectedValue(new Error('数据库连接丢失')))

    try {
      const response = await request(app.getHttpServer())
        .post('/payments/wechat/notify')
        .send({})

      expect(response.status).toBe(500)
      expect(response.body).toEqual({
        code: 'FAIL',
        message: '处理失败',
      })
      expect(JSON.stringify(response.body)).not.toContain('数据库连接丢失')
    }
    finally {
      await app.close()
    }
  })
})
