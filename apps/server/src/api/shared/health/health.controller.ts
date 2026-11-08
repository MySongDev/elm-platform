import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiErrorResponses, ApiSuccessResponse } from '../../../common/swagger/api-response.decorator'
import { HealthService } from '../../../health/health.service'
import { HealthResponseDto } from './dto/health-response.dto'

@ApiTags('共享接口－健康检查')
@ApiErrorResponses(500)
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: '服务健康检查' })
  @ApiSuccessResponse(HealthResponseDto)
  check() {
    return this.healthService.check()
  }
}
