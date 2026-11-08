import { Module } from '@nestjs/common'
import { HealthModule } from '../../health/health.module'
import { ElmModule } from '../../modules/elm/elm.module'
import { HealthController } from './health/health.controller'
import { ElmImageProxyController } from './image/elm-image-proxy.controller'

/** 仅注册本端接口；业务 Provider 来自导入模块，避免重复实例化和反向依赖。 */
@Module({
  imports: [ElmModule, HealthModule],
  controllers: [
    ElmImageProxyController,
    HealthController,
  ],
})
export class SharedApiModule {}
