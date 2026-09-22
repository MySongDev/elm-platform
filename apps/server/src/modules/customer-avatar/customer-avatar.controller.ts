import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiErrorResponses, ApiSuccessResponse } from '../../common/swagger/api-response.decorator'
import { CustomerAuthGuard } from '../customer-auth/guards/customer-auth.guard'
import { CustomerAvatarService } from './customer-avatar.service'
import { CustomerAvatarResponseDto } from './dto/customer-avatar-response.dto'

interface CustomerRequest {
  user: {
    id: number
    phone: string
    subjectType: 'customer'
  }
}

interface UploadedImageFile {
  buffer: Buffer
  mimetype: string
  size: number
}

@ApiTags('用户端头像')
@ApiBearerAuth()
@ApiErrorResponses(401, 500)
@UseGuards(CustomerAuthGuard)
@Controller('customer-avatar')
export class CustomerAvatarController {
  constructor(private readonly avatars: CustomerAvatarService) {}

  @Post()
  @ApiOperation({ summary: '上传当前用户头像' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiSuccessResponse(CustomerAvatarResponseDto, { status: 201 })
  @ApiErrorResponses(400)
  @UseInterceptors(FileInterceptor('file'))
  upload(@Req() req: CustomerRequest, @UploadedFile() file?: UploadedImageFile) {
    return this.avatars.upload(req.user.id, file)
  }
}
