import { Controller, Get } from '@nestjs/common'
import { ApiErrorResponses, ApiOperation, ApiSuccessResponse, ApiTags } from '@nestjs/swagger'
import { HealthResponseDto } from './dto/health-response.dto'
import { HealthService } from './health.service'

@ApiTags('健康检查')
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
