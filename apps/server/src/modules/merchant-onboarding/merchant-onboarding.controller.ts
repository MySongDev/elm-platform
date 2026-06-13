import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { RequirePermissions } from '../auth/decorators/permissions.decorator'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { MerchantApplicationQueryDto, ReviewMerchantApplicationDto } from './dto/merchant-onboarding.dto'
import { MerchantOnboardingService } from './merchant-onboarding.service'

interface AdminRequest {
  user: {
    id: number
    username?: string
  }
}

@ApiTags('Merchant Onboarding')
@ApiBearerAuth()
@Controller('admin/merchant-applications')
@UseGuards(AdminAuthGuard, RolesGuard)
export class MerchantOnboardingController {
  constructor(private readonly merchantOnboardingService: MerchantOnboardingService) {}

  @Get()
  @RequirePermissions('merchant:onboarding:view')
  @ApiOperation({ summary: 'Merchant application list' })
  listApplications(@Query() query: MerchantApplicationQueryDto) {
    return this.merchantOnboardingService.listApplications(query)
  }

  @Get(':id')
  @RequirePermissions('merchant:onboarding:view')
  @ApiOperation({ summary: 'Merchant application detail' })
  getApplicationDetail(@Param('id') id: string) {
    return this.merchantOnboardingService.getApplicationDetail(id)
  }

  @Post(':id/review')
  @RequirePermissions('merchant:onboarding:review')
  @ApiOperation({ summary: 'Review merchant application' })
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
  getApplicationActionLogs(@Param('id') id: string) {
    return this.merchantOnboardingService.getApplicationActionLogs(id)
  }
}
