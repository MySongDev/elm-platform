import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { FILE_STORAGE, FileStorage } from '../storage/local-disk.storage'

const AVATAR_DIRECTORY = 'avatars'
const MAX_AVATAR_BYTES = 2 * 1024 * 1024

const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

export interface UploadedImage {
  buffer: Buffer
  mimetype: string
  size: number
}

@Injectable()
export class CustomerAvatarService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
  ) {}

  async upload(customerId: number, file: UploadedImage | undefined) {
    if (!file) {
      throw new BadRequestException('请选择要上传的图片')
    }

    const extension = ALLOWED_AVATAR_TYPES[file.mimetype]
    if (!extension) {
      throw new BadRequestException('仅支持 jpg、png、webp、gif 图片')
    }
    if (file.size > MAX_AVATAR_BYTES) {
      throw new BadRequestException('图片大小不能超过 2MB')
    }

    const stored = await this.storage.save(file.buffer, {
      directory: AVATAR_DIRECTORY,
      extension,
    })

    await this.prisma.customerUser.update({
      where: { id: customerId },
      data: { avatar: stored.relativePath },
    })

    return { avatar: stored.relativePath }
  }
}
