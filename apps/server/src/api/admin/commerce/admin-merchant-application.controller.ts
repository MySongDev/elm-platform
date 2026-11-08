import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiArrayResponse, ApiErrorResponses, ApiSuccessResponse } from '../../../common/swagger/api-response.decorator'
import { RequirePermissions } from '../../../modules/auth/decorators/permissions.decorator'
import { AdminAuthGuard } from '../../../modules/auth/guards/admin-auth.guard'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'
import { MerchantOnboardingService } from '../../../modules/merchant-onboarding/merchant-onboarding.service'
import { MerchantApplicationActionLogResponseDto, MerchantApplicationResponseDto } from './dto/merchant-onboarding-response.dto'
import { MerchantApplicationQueryDto, ReviewMerchantApplicationDto } from './dto/merchant-onboarding.dto'

interface AdminRequest {
  user: {
    id: number
    username?: string
  }
}

@ApiTags('管理端－商家入驻')
@ApiBearerAuth()
@ApiErrorResponses(401, 403, 500)
@Controller('admin/merchant-applications')
@UseGuards(AdminAuthGuard, RolesGuard)
export class MerchantOnboardingController {
  constructor(private readonly merchantOnboardingService: MerchantOnboardingService) {}

  @Get()
  @RequirePermissions('merchant:onboarding:view')
  @ApiOperation({ summary: 'Merchant application list' })
  @ApiArrayResponse(MerchantApplicationResponseDto)
  @ApiErrorResponses(400)
  listApplications(@Query() query: MerchantApplicationQueryDto) {
    return this.merchantOnboardingService.listApplications(query)
  }

  @Get(':id')
  @RequirePermissions('merchant:onboarding:view')
  @ApiOperation({ summary: 'Merchant application detail' })
  @ApiSuccessResponse(MerchantApplicationResponseDto)
  @ApiErrorResponses(404)
  getApplicationDetail(@Param('id') id: string) {
    return this.merchantOnboardingService.getApplicationDetail(id)
  }

  @Post(':id/review')
  @RequirePermissions('merchant:onboarding:review')
  @ApiOperation({ summary: 'Review merchant application' })
  @ApiSuccessResponse(MerchantApplicationResponseDto, { status: 201 })
  @ApiErrorResponses(400, 404, 409)
  reviewApplication(
    @Param('id') id: string,
    @Body() dto: ReviewMerchantApplicationDto,
    @Request() req: AdminRequest,
  ) {
    return this.merchantOnboardingService.reviewApplication(id, {
      action: dto.action,
      reason: dto.reason,
      remark: dto.remark,
    }, {
      id: req.user.id,
      name: req.user.username || `admin#${req.user.id}`,
      type: 'PLATFORM_ADMIN',
    })
  }

  @Get(':id/action-logs')
  @RequirePermissions('merchant:onboarding:view')
  @ApiOperation({ summary: 'Merchant application action logs' })
  @ApiArrayResponse(MerchantApplicationActionLogResponseDto)
  @ApiErrorResponses(404)
  getApplicationActionLogs(@Param('id') id: string) {
    return this.merchantOnboardingService.getApplicationActionLogs(id)
  }
}
